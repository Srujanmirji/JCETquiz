-- ============================================================================
-- 0011_revoke_trigger_functions.sql — advisor remediation
--
-- Trigger functions should never be callable through the REST API. Postgres
-- invokes them with a NEW/OLD record; a direct RPC call is meaningless at best,
-- so remove the exposure (Supabase linter 0028/0029).
--
-- Still reported, all intentional:
--   admin_dashboard()   raises 'forbidden' unless the caller is an admin
--   is_admin()          returns only whether the CALLER is an admin
--   workshop_complete() a boolean the student dashboard needs; leaks nothing
-- ============================================================================

revoke all on function public.promote_allowlisted_admin()       from public, anon, authenticated;
revoke all on function public.freeze_completed_attempt()        from public, anon, authenticated;
revoke all on function public.freeze_answers()                  from public, anon, authenticated;
revoke all on function public.protect_answered_questions()      from public, anon, authenticated;
revoke all on function public.block_answered_question_delete()  from public, anon, authenticated;
revoke all on function public.freeze_certificate_identity()     from public, anon, authenticated;
revoke all on function public.freeze_profile_identity()         from public, anon, authenticated;
revoke all on function public.touch_updated_at()                from public, anon, authenticated;
