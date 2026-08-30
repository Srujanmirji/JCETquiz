-- ============================================================================
-- 0003_functions.sql — server-authoritative quiz lifecycle
--
-- All scoring lives here. The client's role is limited to submitting
-- {question_id, selected_option} pairs; it can neither supply nor influence a
-- score, a percentage, or an eligibility flag (docs/SECURITY.md).
-- ============================================================================

-- ------------------------------------------------------------ start_attempt --
-- Idempotent. Returns the caller's attempt, creating it only if absent.
create or replace function public.start_attempt(p_profile_id uuid)
returns public.quiz_attempts
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt public.quiz_attempts;
  v_open    boolean;
begin
  select quiz_open into v_open from public.workshop_settings where id = true;
  if not coalesce(v_open, false) then
    raise exception 'quiz is closed' using errcode = 'P0002';
  end if;

  select * into v_attempt from public.quiz_attempts where profile_id = p_profile_id;

  if found then
    -- Already completed: caller must be routed to results, not to the quiz.
    if v_attempt.status = 'completed' then
      raise exception 'attempt already completed' using errcode = 'P0001';
    end if;
    return v_attempt;
  end if;

  -- The UNIQUE(profile_id) constraint is the real guard; ON CONFLICT makes a
  -- double-click return the existing row instead of a 500.
  insert into public.quiz_attempts (profile_id, status, started_at)
  values (p_profile_id, 'started', now())
  on conflict (profile_id) do update set profile_id = excluded.profile_id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- ------------------------------------------------------------- submit_quiz --
-- p_answers: jsonb array of {"question_id": uuid, "selected_option": 0..3}
-- Unanswered questions are recorded with a null selection and score zero
-- (docs/API.md, "Missing answer ... Recommended: yes").
create or replace function public.submit_quiz(p_profile_id uuid, p_answers jsonb)
returns public.quiz_attempts
language plpgsql security definer set search_path = public
as $$
declare
  v_attempt   public.quiz_attempts;
  v_html      integer;
  v_css       integer;
  v_js        integer;
  v_total     integer;
  v_pct       numeric(5,2);
  v_eligible  boolean;
  v_prefix    text;
  v_cert_no   text;
  v_cert_name text;
  v_quiz_open boolean;
begin
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'answers must be a json array' using errcode = '22023';
  end if;

  -- Serialise concurrent submissions (two tabs, double-tap, retry storm).
  -- The second caller blocks here, then observes status='completed' below.
  select * into v_attempt
  from public.quiz_attempts
  where profile_id = p_profile_id
  for update;

  if not found then
    raise exception 'no attempt to submit' using errcode = 'P0003';
  end if;

  if v_attempt.status = 'completed' then
    raise exception 'attempt already completed' using errcode = 'P0001';
  end if;

  select quiz_open into v_quiz_open from public.workshop_settings where id = true;
  if coalesce(v_quiz_open, false) = false then
    raise exception 'quiz is currently closed' using errcode = 'P0002';
  end if;

  -- Reject unknown or inactive question ids outright (docs/API.md error cases),
  -- and out-of-range selections. Parsed inline rather than through a temp table
  -- so the function holds no session-scoped state between calls.
  if exists (
    select 1
    from jsonb_array_elements(p_answers) as e
    left join public.quiz_questions q
      on q.id = (e.value ->> 'question_id')::uuid and q.is_active
    where q.id is null
  ) then
    raise exception 'submission references unknown or inactive questions'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_answers) as e
    where nullif(e.value ->> 'selected_option', '') is not null
      and (e.value ->> 'selected_option')::integer not between 0 and 3
  ) then
    raise exception 'selected_option out of range' using errcode = '22023';
  end if;

  -- Grade against every active question, so omissions score zero rather than
  -- shrinking the denominator. The answer key is read here and nowhere the
  -- client can reach.
  with submitted as (
    select distinct on (question_id)
           (e.value ->> 'question_id')::uuid                 as question_id,
           nullif(e.value ->> 'selected_option', '')::integer as selected_option
    from jsonb_array_elements(p_answers) as e
    order by question_id
  )
  insert into public.quiz_answers (attempt_id, question_id, selected_option, is_correct)
  select v_attempt.id,
         q.id,
         s.selected_option,
         s.selected_option is not null and s.selected_option = q.correct_option
  from public.quiz_questions q
  left join submitted s on s.question_id = q.id
  where q.is_active
  on conflict (attempt_id, question_id) do nothing;

  select
    count(*) filter (where q.category = 'HTML'       and a.is_correct),
    count(*) filter (where q.category = 'CSS'        and a.is_correct),
    count(*) filter (where q.category = 'JavaScript' and a.is_correct)
  into v_html, v_css, v_js
  from public.quiz_answers a
  join public.quiz_questions q on q.id = a.question_id
  where a.attempt_id = v_attempt.id;

  v_total := v_html + v_css + v_js;
  v_pct   := round((v_total * 100.0) / 30, 2);

  -- Eligibility is decided on the INTEGER score, never the rounded percentage.
  -- 21/30 is eligible; 20/30 (66.67%) is not. No float ever touches the
  -- boundary, which closes the 69.99% case raised in IMPLEMENTATION-PLAN.md.
  v_eligible := v_total >= 21;

  update public.quiz_attempts
  set status               = 'completed',
      submitted_at         = now(),
      html_score           = v_html,
      css_score            = v_css,
      javascript_score     = v_js,
      total_score          = v_total,
      percentage           = v_pct,
      certificate_eligible = v_eligible
  where id = v_attempt.id
  returning * into v_attempt;

  -- Pre-create the certificate record for eligible students so the admin
  -- Certificates screen has a row to act on and audit against.
  if v_eligible then
    select certificate_prefix into v_prefix from public.workshop_settings where id = true;
    select name into v_cert_name from public.profiles where id = p_profile_id;
    v_cert_no := coalesce(v_prefix, 'WDW') || '-' ||
                 to_char(now(), 'YYYY') || '-' ||
                 lpad(nextval('public.certificate_number_seq')::text, 5, '0');

    insert into public.certificates (profile_id, attempt_id, certificate_name, certificate_number, status)
    values (p_profile_id, v_attempt.id, v_cert_name, v_cert_no, 'eligible')
    on conflict (attempt_id) do nothing;
  end if;

  return v_attempt;
end;
$$;

-- --------------------------------------------------------- admin_dashboard --
create or replace function public.admin_dashboard()
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v jsonb;
begin
  -- The server calls this with the service role, which has no auth.uid();
  -- authorisation for that path is already done by requireAdminApi().
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'totalParticipants', (select count(*) from public.profiles),
    'completedQuizzes',  (select count(*) from public.quiz_attempts where status = 'completed'),
    'inProgress',        (select count(*) from public.quiz_attempts where status = 'started'),
    'eligibleStudents',  (select count(*) from public.quiz_attempts where certificate_eligible),
    'notEligible',       (select count(*) from public.quiz_attempts
                          where status = 'completed' and not certificate_eligible),
    'certificatesSent',  (select count(*) from public.certificates where status = 'sent'),
    'averageScore',      (select coalesce(round(avg(total_score), 1), 0)
                          from public.quiz_attempts where status = 'completed')
  ) into v;

  return v;
end;
$$;

-- ------------------------------------------------- question edit guardrail --
-- ADMIN.md: "Avoid editing live questions in a way that changes the meaning of
-- an already completed attempt." Once a question has been graded, its text,
-- options, and answer key are frozen; only is_active and explanation may move.
create or replace function public.protect_answered_questions()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.quiz_answers where question_id = old.id) then
    if new.question_text  is distinct from old.question_text
       or new.options     is distinct from old.options
       or new.correct_option is distinct from old.correct_option
       or new.category    is distinct from old.category then
      raise exception
        'question % has been answered in a graded attempt; only is_active and explanation may change', old.id
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists questions_protect_answered on public.quiz_questions;
create trigger questions_protect_answered
  before update on public.quiz_questions
  for each row execute function public.protect_answered_questions();

create or replace function public.block_answered_question_delete()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.quiz_answers where question_id = old.id) then
    raise exception 'question % is referenced by a graded attempt; disable it instead', old.id
      using errcode = '42501';
  end if;
  return old;
end;
$$;

drop trigger if exists questions_block_answered_delete on public.quiz_questions;
create trigger questions_block_answered_delete
  before delete on public.quiz_questions
  for each row execute function public.block_answered_question_delete();

-- ------------------------------------------------------------------ grants --
-- start_attempt/submit_quiz are invoked by the server with the service role.
-- They are NOT granted to `authenticated`, so a student cannot call them
-- directly from the browser with a forged profile id.
revoke all on function public.start_attempt(uuid)      from public, anon, authenticated;
revoke all on function public.submit_quiz(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.admin_dashboard()        from public, anon;

grant execute on function public.start_attempt(uuid)      to service_role;
grant execute on function public.submit_quiz(uuid, jsonb) to service_role;
grant execute on function public.admin_dashboard()        to authenticated, service_role;
grant usage  on sequence public.certificate_number_seq    to service_role;
