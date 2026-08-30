-- ============================================================================
-- 0010_rls_four_quiz.sql — RLS for the four-quiz architecture
--
-- Students may READ their own rows and the open question surface, nothing more.
-- They hold no insert/update path into attempts, answers, results, or
-- certificates: every such write goes through a SECURITY DEFINER function that
-- the server calls with the service role.
-- ============================================================================

alter table public.quizzes       enable row level security;
alter table public.questions     enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers  enable row level security;
alter table public.final_results enable row level security;
alter table public.certificates  enable row level security;

-- ----------------------------------------------------------------- quizzes --
-- Session state must be readable: the dashboard shows what is open right now.
-- It carries no answer data.
create policy quizzes_select_all on public.quizzes
  for select to authenticated using (true);

create policy quizzes_admin_write on public.quizzes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------- questions --
create policy questions_admin_all on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy questions_select_active on public.questions
  for select to authenticated using (is_active = true);

-- Belt and braces: the answer key is not merely policy-protected, the column
-- grant itself is withheld from every browser-facing role.
revoke select on public.questions from anon, authenticated;
grant  select (id, quiz_id, question_text, options, position, is_active)
  on public.questions to authenticated;
grant  select on public.public_questions to authenticated;

-- ----------------------------------------------------------- quiz_attempts --
create policy attempts_select_own on public.quiz_attempts
  for select to authenticated using (profile_id = auth.uid());

create policy attempts_select_admin on public.quiz_attempts
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------ quiz_answers --
create policy answers_select_own on public.quiz_answers
  for select to authenticated
  using (exists (select 1 from public.quiz_attempts a
                 where a.id = quiz_answers.attempt_id and a.profile_id = auth.uid()));

create policy answers_select_admin on public.quiz_answers
  for select to authenticated using (public.is_admin());

-- ----------------------------------------------------------- final_results --
create policy final_select_own on public.final_results
  for select to authenticated using (profile_id = auth.uid());

create policy final_select_admin on public.final_results
  for select to authenticated using (public.is_admin());

-- ------------------------------------------------------------ certificates --
create policy certificates_select_own on public.certificates
  for select to authenticated using (profile_id = auth.uid());

create policy certificates_admin_all on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------ grants --
-- Lifecycle functions are invoked by the SERVER with the service role. They are
-- not granted to `authenticated`, so a student cannot call them from the
-- browser with a forged profile id.
revoke all on function public.start_quiz_attempt(uuid, text)      from public, anon, authenticated;
revoke all on function public.submit_quiz(uuid, text, jsonb)      from public, anon, authenticated;
revoke all on function public.recompute_final_result(uuid)        from public, anon, authenticated;
revoke all on function public.student_progress(uuid)              from public, anon, authenticated;
revoke all on function public.open_quiz_session(text)             from public, anon, authenticated;
revoke all on function public.close_quiz_session(text)            from public, anon, authenticated;
revoke all on function public.force_close_quiz_session(text)      from public, anon, authenticated;
revoke all on function public.admin_reset_attempt(uuid, text)     from public, anon, authenticated;
revoke all on function public.admin_dashboard()                   from public, anon;
revoke all on function public.workshop_complete()                 from public, anon;

grant execute on function public.start_quiz_attempt(uuid, text)   to service_role;
grant execute on function public.submit_quiz(uuid, text, jsonb)   to service_role;
grant execute on function public.recompute_final_result(uuid)     to service_role;
grant execute on function public.student_progress(uuid)           to service_role;
grant execute on function public.open_quiz_session(text)          to service_role;
grant execute on function public.close_quiz_session(text)         to service_role;
grant execute on function public.force_close_quiz_session(text)   to service_role;
grant execute on function public.admin_reset_attempt(uuid, text)  to service_role;
grant execute on function public.admin_dashboard()                to authenticated, service_role;
grant execute on function public.workshop_complete()              to authenticated, service_role;
grant usage  on sequence public.certificate_number_seq            to service_role;
