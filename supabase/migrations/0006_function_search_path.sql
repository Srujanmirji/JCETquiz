-- ============================================================================
-- 0006_function_search_path.sql — advisor remediation
--
-- Supabase linter 0011: a function that runs with the table owner's rights and
-- a MUTABLE search_path lets a caller shadow a referenced object and escalate
-- privileges. Every trigger and helper function gets a pinned path.
--
-- Linter 0028: is_admin() must not be reachable unauthenticated.
-- ============================================================================

alter function public.touch_updated_at()               set search_path = public, pg_temp;
alter function public.freeze_profile_identity()        set search_path = public, pg_temp;
alter function public.freeze_completed_attempt()       set search_path = public, pg_temp;
alter function public.freeze_answers()                 set search_path = public, pg_temp;
alter function public.protect_answered_questions()     set search_path = public, pg_temp;
alter function public.block_answered_question_delete() set search_path = public, pg_temp;
alter function public.enforce_certificate_ownership()  set search_path = public, pg_temp;
alter function public.freeze_certificate_identity()    set search_path = public, pg_temp;

revoke execute on function public.is_admin() from anon;

-- Still reported, both intentional:
--   admin_dashboard() — callable by `authenticated`, but raises 'forbidden'
--     unless the caller is in admin_users or is the service role.
--   is_admin()        — callable by `authenticated`; returns only whether the
--     CALLER is an admin, and the RLS policies depend on it.
