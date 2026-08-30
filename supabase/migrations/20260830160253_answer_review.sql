-- Answer keys remain inaccessible through tables and public_questions.
-- Only the trusted server may request review for its authenticated student.
create or replace function public.quiz_answer_review(p_profile_id uuid, p_slug text)
returns jsonb
language plpgsql stable security invoker set search_path = ''
as $$
declare
  v_quiz public.quizzes;
  v_attempt_id uuid;
  v_questions jsonb;
begin
  select * into v_quiz from public.quizzes where slug = p_slug and is_active;
  if not found then
    raise exception 'unknown quiz' using errcode = '22023';
  end if;

  select id into v_attempt_id from public.quiz_attempts
  where profile_id = p_profile_id and quiz_id = v_quiz.id and status = 'completed';
  if v_attempt_id is null then
    return jsonb_build_object('state', 'not_completed', 'questions', '[]'::jsonb);
  end if;

  if v_quiz.session_state <> 'closed' then
    return jsonb_build_object('state', 'session_open', 'questions', '[]'::jsonb);
  end if;

  -- Ending a session blocks NEW attempts, but existing attempts may still
  -- submit. Do not release the key while anyone can still use it to answer.
  if exists (select 1 from public.quiz_attempts
             where quiz_id = v_quiz.id and status = 'started') then
    return jsonb_build_object('state', 'awaiting_submissions', 'questions', '[]'::jsonb);
  end if;

  -- Start from graded answers, not the current active bank: disabled questions
  -- stay in this student's review and newly added questions never appear.
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', q.id,
    'question_text', q.question_text,
    'options', q.options,
    'selected_option', a.selected_option,
    'correct_option', q.correct_option,
    'is_correct', a.is_correct,
    'explanation', q.explanation
  ) order by q.position, q.id), '[]'::jsonb)
  into v_questions
  from public.quiz_answers a
  join public.questions q on q.id = a.question_id and q.quiz_id = v_quiz.id
  where a.attempt_id = v_attempt_id;

  return jsonb_build_object('state', 'available', 'questions', v_questions);
end;
$$;

revoke all on function public.quiz_answer_review(uuid, text) from public, anon, authenticated;
grant execute on function public.quiz_answer_review(uuid, text) to service_role;

comment on function public.quiz_answer_review(uuid, text) is
  'Server-only review of a submitted attempt. Requires a closed active session
   with no in-flight attempts. All checks share the calling statement snapshot;
   reopening blocks subsequent requests but cannot retract already read answers.';
