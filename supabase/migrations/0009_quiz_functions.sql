-- ============================================================================
-- 0009_quiz_functions.sql — server-authoritative lifecycle for four quizzes
--
-- Everything that decides a score, an unlock, or an eligibility lives here.
-- The client only ever submits {question_id, selected_option} pairs.
-- ============================================================================

-- ------------------------------------------------------------- helpers ------
create or replace function public.workshop_complete()
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.quizzes where is_active and session_state <> 'closed'
  );
$$;

comment on function public.workshop_complete() is
  'True once every session has been closed. Gates the final-result screen, so a
   student who missed a session still sees a result at the end.';

-- --------------------------------------------------- session control (admin) --
create or replace function public.open_quiz_session(p_slug text)
returns public.quizzes
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_quiz public.quizzes;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Only one session runs at a time. Starting a new one closes whatever was
  -- open, so a forgotten "end session" cannot leave two quizzes live.
  update public.quizzes
  set session_state = 'closed', closed_at = now()
  where session_state = 'open' and slug <> p_slug;

  update public.quizzes
  set session_state = 'open', opened_at = now(), closed_at = null
  where slug = p_slug
  returning * into v_quiz;

  if not found then
    raise exception 'unknown quiz %', p_slug using errcode = '22023';
  end if;
  return v_quiz;
end;
$$;

create or replace function public.close_quiz_session(p_slug text)
returns public.quizzes
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_quiz public.quizzes;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.quizzes
  set session_state = 'closed', closed_at = now()
  where slug = p_slug
  returning * into v_quiz;

  if not found then
    raise exception 'unknown quiz %', p_slug using errcode = '22023';
  end if;
  return v_quiz;
end;
$$;

-- Auto-submit anyone still mid-quiz. Separate from close_quiz_session so the
-- instructor can end a session without cutting students off, then force-close
-- deliberately once the in-progress count reaches zero (or they run out of time).
create or replace function public.force_close_quiz_session(p_slug text)
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_quiz_id uuid;
  v_count   integer := 0;
  v_att     record;
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select id into v_quiz_id from public.quizzes where slug = p_slug;
  if v_quiz_id is null then
    raise exception 'unknown quiz %', p_slug using errcode = '22023';
  end if;

  for v_att in
    select a.profile_id from public.quiz_attempts a
    where a.quiz_id = v_quiz_id and a.status = 'started'
  loop
    -- Grades whatever they had recorded; unanswered questions score zero.
    perform public.submit_quiz(v_att.profile_id, p_slug, '[]'::jsonb);
    v_count := v_count + 1;
  end loop;

  perform public.close_quiz_session(p_slug);
  return v_count;
end;
$$;

-- ------------------------------------------------------- start an attempt ---
create or replace function public.start_quiz_attempt(p_profile_id uuid, p_slug text)
returns public.quiz_attempts
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_quiz    public.quizzes;
  v_attempt public.quiz_attempts;
begin
  select * into v_quiz from public.quizzes where slug = p_slug and is_active;
  if not found then
    raise exception 'unknown quiz %', p_slug using errcode = '22023';
  end if;

  select * into v_attempt
  from public.quiz_attempts
  where profile_id = p_profile_id and quiz_id = v_quiz.id;

  if found then
    if v_attempt.status = 'completed' then
      raise exception 'quiz % already completed', p_slug using errcode = 'P0001';
    end if;
    return v_attempt;  -- resume an in-flight attempt
  end if;

  -- A NEW attempt requires an open session. In-flight attempts are unaffected
  -- when the instructor ends the session, so nobody is cut off mid-question.
  if v_quiz.session_state <> 'open' then
    raise exception 'quiz % session is not open', p_slug using errcode = 'P0002';
  end if;

  insert into public.quiz_attempts (profile_id, quiz_id, status, started_at)
  values (p_profile_id, v_quiz.id, 'started', now())
  on conflict (profile_id, quiz_id) do update set profile_id = excluded.profile_id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- ------------------------------------------------------------ submit -------
create or replace function public.submit_quiz(p_profile_id uuid, p_slug text, p_answers jsonb)
returns public.quiz_attempts
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_quiz    public.quizzes;
  v_attempt public.quiz_attempts;
  v_score   integer;
  v_total   integer;
begin
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'answers must be a json array' using errcode = '22023';
  end if;

  select * into v_quiz from public.quizzes where slug = p_slug and is_active;
  if not found then
    raise exception 'unknown quiz %', p_slug using errcode = '22023';
  end if;

  -- Row lock serialises concurrent submissions (two tabs, double-tap, retry).
  select * into v_attempt
  from public.quiz_attempts
  where profile_id = p_profile_id and quiz_id = v_quiz.id
  for update;

  if not found then
    raise exception 'no attempt to submit for %', p_slug using errcode = 'P0003';
  end if;
  if v_attempt.status = 'completed' then
    raise exception 'quiz % already completed', p_slug using errcode = 'P0001';
  end if;

  -- Reject anything not belonging to THIS quiz, so a student cannot smuggle in
  -- answers from another paper.
  if exists (
    select 1 from jsonb_array_elements(p_answers) e
    left join public.questions q
      on q.id = (e.value ->> 'question_id')::uuid
     and q.quiz_id = v_quiz.id and q.is_active
    where q.id is null
  ) then
    raise exception 'submission references questions outside this quiz'
      using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_array_elements(p_answers) e
    where nullif(e.value ->> 'selected_option','') is not null
      and (e.value ->> 'selected_option')::integer not between 0 and 3
  ) then
    raise exception 'selected_option out of range' using errcode = '22023';
  end if;

  -- Grade against EVERY active question in the quiz, so omissions score zero
  -- instead of shrinking the denominator.
  with submitted as (
    select distinct on (question_id)
           (e.value ->> 'question_id')::uuid                  as question_id,
           nullif(e.value ->> 'selected_option','')::integer  as selected_option
    from jsonb_array_elements(p_answers) e
    order by question_id
  )
  insert into public.quiz_answers (attempt_id, question_id, selected_option, is_correct)
  select v_attempt.id, q.id, s.selected_option,
         s.selected_option is not null and s.selected_option = q.correct_option
  from public.questions q
  left join submitted s on s.question_id = q.id
  where q.quiz_id = v_quiz.id and q.is_active
  on conflict (attempt_id, question_id) do nothing;

  select count(*) filter (where a.is_correct), count(*)
  into v_score, v_total
  from public.quiz_answers a
  where a.attempt_id = v_attempt.id;

  update public.quiz_attempts
  set status          = 'completed',
      submitted_at    = now(),
      score           = v_score,
      total_questions = v_total,
      percentage      = round((v_score * 100.0) / nullif(v_total, 0), 2)
  where id = v_attempt.id
  returning * into v_attempt;

  perform public.recompute_final_result(p_profile_id);
  return v_attempt;
end;
$$;

-- ------------------------------------------------- final result (derived) ---
-- The ONLY writer of final_results and certificates. Never called by hand.
create or replace function public.recompute_final_result(p_profile_id uuid)
returns public.final_results
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_html int; v_css int; v_js int; v_py int;
  v_total int; v_done int; v_qtotal int; v_pct numeric(5,2);
  v_eligible boolean;
  v_final public.final_results;
  v_prefix text; v_name text; v_email text; v_no text;
begin
  select
    coalesce(sum(a.score) filter (where z.slug = 'html'), 0),
    coalesce(sum(a.score) filter (where z.slug = 'css'), 0),
    coalesce(sum(a.score) filter (where z.slug = 'javascript'), 0),
    coalesce(sum(a.score) filter (where z.slug = 'python'), 0),
    count(*) filter (where a.status = 'completed')
  into v_html, v_css, v_js, v_py, v_done
  from public.quiz_attempts a
  join public.quizzes z on z.id = a.quiz_id
  where a.profile_id = p_profile_id and a.status = 'completed';

  -- Denominator is the whole workshop, always. A missed quiz scores zero
  -- rather than reducing what the student is measured against.
  select coalesce(sum(question_count), 40) into v_qtotal
  from public.quizzes where is_active;

  v_total    := v_html + v_css + v_js + v_py;
  v_pct      := round((v_total * 100.0) / nullif(v_qtotal, 0), 2);
  -- Eligibility is decided on the INTEGER score, never a rounded percentage.
  -- 28/40 is exactly 70%; 27/40 is not. No float touches the boundary.
  v_eligible := v_total >= ceil(v_qtotal * 0.7);

  insert into public.final_results as f
    (profile_id, html_score, css_score, javascript_score, python_score,
     total_score, total_questions, percentage, quizzes_completed, certificate_eligible)
  values
    (p_profile_id, v_html, v_css, v_js, v_py,
     v_total, v_qtotal, v_pct, v_done, v_eligible)
  on conflict (profile_id) do update
    set html_score = excluded.html_score,
        css_score = excluded.css_score,
        javascript_score = excluded.javascript_score,
        python_score = excluded.python_score,
        total_score = excluded.total_score,
        total_questions = excluded.total_questions,
        percentage = excluded.percentage,
        quizzes_completed = excluded.quizzes_completed,
        certificate_eligible = excluded.certificate_eligible,
        updated_at = now()
  returning * into v_final;

  if v_eligible then
    select certificate_prefix into v_prefix from public.workshop_settings where id = true;
    select name, email into v_name, v_email from public.profiles where id = p_profile_id;
    v_no := coalesce(v_prefix,'WDW') || '-' || to_char(now(),'YYYY') || '-' ||
            lpad(nextval('public.certificate_number_seq')::text, 5, '0');

    insert into public.certificates
      (profile_id, final_result_id, certificate_name, certificate_number, status, email)
    values (p_profile_id, v_final.id, v_name, v_no, 'eligible', v_email)
    on conflict (profile_id) do nothing;
  end if;

  return v_final;
end;
$$;

-- --------------------------------------------------- student progress view --
create or replace function public.student_progress(p_profile_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v jsonb;
begin
  select jsonb_build_object(
    'quizzes', coalesce(jsonb_agg(jsonb_build_object(
        'slug', z.slug,
        'title', z.title,
        'subtitle', z.subtitle,
        'orderIndex', z.order_index,
        'questionCount', z.question_count,
        'sessionState', z.session_state,
        'score', a.score,
        'percentage', a.percentage,
        'state',
          case
            when a.status = 'completed'   then 'completed'
            when z.session_state = 'open' then 'available'
            when z.session_state = 'closed' then 'missed'
            else 'locked'
          end
      ) order by z.order_index), '[]'::jsonb),
    'workshopComplete', public.workshop_complete(),
    'final', (select to_jsonb(f) from public.final_results f where f.profile_id = p_profile_id)
  ) into v
  from public.quizzes z
  left join public.quiz_attempts a
    on a.quiz_id = z.id and a.profile_id = p_profile_id
  where z.is_active;

  return v;
end;
$$;

-- ------------------------------------------------------- admin dashboard ----
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v jsonb;
begin
  if coalesce(auth.role(),'') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'totalParticipants', (select count(*) from public.profiles),
    'perQuiz', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', z.slug, 'title', z.title, 'orderIndex', z.order_index,
        'sessionState', z.session_state,
        'started',   (select count(*) from public.quiz_attempts a where a.quiz_id = z.id),
        'inProgress',(select count(*) from public.quiz_attempts a where a.quiz_id = z.id and a.status='started'),
        'completed', (select count(*) from public.quiz_attempts a where a.quiz_id = z.id and a.status='completed'),
        'average',   (select coalesce(round(avg(a.score),1),0) from public.quiz_attempts a where a.quiz_id = z.id and a.status='completed'),
        'highest',   (select coalesce(max(a.score),0) from public.quiz_attempts a where a.quiz_id = z.id and a.status='completed'),
        'lowest',    (select coalesce(min(a.score),0) from public.quiz_attempts a where a.quiz_id = z.id and a.status='completed')
      ) order by z.order_index), '[]'::jsonb)
      from public.quizzes z where z.is_active
    ),
    'allCompleted',     (select count(*) from public.final_results where quizzes_completed >= 4),
    'eligible',         (select count(*) from public.final_results where certificate_eligible),
    'certificatesSent', (select count(*) from public.certificates where status = 'sent'),
    'averageTotal',     (select coalesce(round(avg(total_score),1),0) from public.final_results),
    'workshopComplete', public.workshop_complete()
  ) into v;

  return v;
end;
$$;

-- ------------------------------------------------- admin: reset an attempt --
-- Event-day escape hatch: a student signs in with the wrong Google account or
-- their browser dies mid-quiz. Without this, one attempt per quiz is a trap.
create or replace function public.admin_reset_attempt(p_profile_id uuid, p_slug text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_quiz_id uuid;
begin
  if coalesce(auth.role(),'') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select id into v_quiz_id from public.quizzes where slug = p_slug;
  if v_quiz_id is null then
    raise exception 'unknown quiz %', p_slug using errcode = '22023';
  end if;

  delete from public.quiz_answers
  where attempt_id in (select id from public.quiz_attempts
                       where profile_id = p_profile_id and quiz_id = v_quiz_id);
  delete from public.quiz_attempts
  where profile_id = p_profile_id and quiz_id = v_quiz_id;

  perform public.recompute_final_result(p_profile_id);
  return true;
end;
$$;

-- ----------------------------------------------------------- immutability ---
create or replace function public.freeze_completed_attempt()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status = 'completed' then
    raise exception 'attempt % is already completed and cannot be modified', old.id
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger attempts_freeze_completed
  before update on public.quiz_attempts
  for each row execute function public.freeze_completed_attempt();

create or replace function public.freeze_answers()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'quiz answers are immutable once recorded' using errcode = '42501';
end;
$$;

create trigger answers_freeze
  before update on public.quiz_answers
  for each row execute function public.freeze_answers();

create or replace function public.protect_answered_questions()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.quiz_answers where question_id = old.id) then
    if new.question_text is distinct from old.question_text
       or new.options is distinct from old.options
       or new.correct_option is distinct from old.correct_option
       or new.quiz_id is distinct from old.quiz_id then
      raise exception
        'question % has been graded; only is_active and explanation may change', old.id
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger questions_protect_answered
  before update on public.questions
  for each row execute function public.protect_answered_questions();

create or replace function public.block_answered_question_delete()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if exists (select 1 from public.quiz_answers where question_id = old.id) then
    raise exception 'question % is referenced by a graded attempt; disable it instead', old.id
      using errcode = '42501';
  end if;
  return old;
end;
$$;

create trigger questions_block_answered_delete
  before delete on public.questions
  for each row execute function public.block_answered_question_delete();

create or replace function public.freeze_certificate_identity()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if new.certificate_name is distinct from old.certificate_name
     or new.certificate_number is distinct from old.certificate_number then
    raise exception 'certificate identity is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger certificates_freeze_identity
  before update on public.certificates
  for each row execute function public.freeze_certificate_identity();
