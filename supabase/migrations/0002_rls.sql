-- ============================================================================
-- 0002_rls.sql — Row Level Security + immutability triggers
--
-- Model (docs/SECURITY.md, docs/SUPABASE.md):
--   Students may READ their own rows and nothing else.
--   Students have NO insert/update path into attempts, answers, or certificates.
--   Every write that decides a score, an eligibility, or a certificate happens
--   through the service role in a server-only code path.
-- ============================================================================

alter table public.profiles          enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.quiz_answers      enable row level security;
alter table public.certificates      enable row level security;
alter table public.admin_users       enable row level security;
alter table public.workshop_settings enable row level security;

-- ---------------------------------------------------------------- helpers --
-- SECURITY DEFINER so the admin check itself is not subject to admin_users RLS,
-- which would otherwise recurse.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------- profiles --
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_insert_own   on public.profiles;
drop policy if exists profiles_update_own   on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_insert_own on public.profiles
  for insert to authenticated with check (id = auth.uid());

-- Students may edit their own profile, but never their identity. The WITH CHECK
-- pins id; the immutable-email trigger below pins the address.
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_select_admin on public.profiles
  for select to authenticated using (public.is_admin());

-- Email comes from the verified Google identity and is never client-editable.
create or replace function public.freeze_profile_identity()
returns trigger language plpgsql as $$
begin
  if new.email is distinct from old.email then
    raise exception 'profile email is immutable' using errcode = '42501';
  end if;
  if new.id is distinct from old.id then
    raise exception 'profile id is immutable' using errcode = '42501';
  end if;
  if new.name is distinct from old.name and exists (
    select 1 from public.quiz_attempts where profile_id = old.id and status = 'completed' for update
  ) then
    raise exception 'profile name is immutable after quiz completion' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_freeze_identity on public.profiles;
create trigger profiles_freeze_identity
  before update on public.profiles
  for each row execute function public.freeze_profile_identity();

-- ---------------------------------------------------------- quiz_questions --
-- No student-facing SELECT policy on the base table at all. RLS denies by
-- default, so correct_option is unreachable with the anon key. Students read
-- public.public_questions (security_invoker) which needs its own grant path.
drop policy if exists questions_admin_all on public.quiz_questions;
drop policy if exists questions_select_active_public on public.quiz_questions;

create policy questions_admin_all on public.quiz_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The view is security_invoker, so the caller still needs a row-level grant.
-- This policy is column-blind, but the VIEW's projection omits correct_option,
-- and we revoke direct table access below — so students can only ever see the
-- five public columns.
create policy questions_select_active_public on public.quiz_questions
  for select to authenticated using (is_active = true);

-- Belt and braces: revoke the column outright for the anon/authenticated roles.
revoke select on public.quiz_questions from anon, authenticated;
grant  select (id, category, question_text, options, position, is_active)
  on public.quiz_questions to authenticated;
grant  select on public.public_questions to authenticated;

-- ----------------------------------------------------------- quiz_attempts --
drop policy if exists attempts_select_own   on public.quiz_attempts;
drop policy if exists attempts_select_admin on public.quiz_attempts;

-- Readable at ANY status: a student mid-quiz must be able to resume.
create policy attempts_select_own on public.quiz_attempts
  for select to authenticated using (profile_id = auth.uid());

create policy attempts_select_admin on public.quiz_attempts
  for select to authenticated using (public.is_admin());

-- Deliberately NO insert/update/delete policy for students. Attempts are
-- created and completed by the service role only.

-- Hard stop on mutating a finished attempt — applies to the service role too.
-- UPDATE only: a DELETE guard here would also block the ON DELETE CASCADE from
-- profiles/auth.users, turning account removal into an unexplained failure.
-- Students cannot delete either way — RLS grants them no DELETE policy at all.
create or replace function public.freeze_completed_attempt()
returns trigger language plpgsql as $$
begin
  if old.status = 'completed' then
    raise exception 'attempt % is already completed and cannot be modified', old.id
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists attempts_freeze_completed on public.quiz_attempts;
create trigger attempts_freeze_completed
  before update on public.quiz_attempts
  for each row execute function public.freeze_completed_attempt();

-- ------------------------------------------------------------ quiz_answers --
drop policy if exists answers_select_own   on public.quiz_answers;
drop policy if exists answers_select_admin on public.quiz_answers;

create policy answers_select_own on public.quiz_answers
  for select to authenticated
  using (exists (
    select 1 from public.quiz_attempts a
    where a.id = quiz_answers.attempt_id and a.profile_id = auth.uid()
  ));

create policy answers_select_admin on public.quiz_answers
  for select to authenticated using (public.is_admin());

-- Answers are write-once, by the server, inside the submit transaction.
-- UPDATE only, for the same cascade reason as above.
create or replace function public.freeze_answers()
returns trigger language plpgsql as $$
begin
  raise exception 'quiz answers are immutable once recorded'
    using errcode = '42501';
end;
$$;

drop trigger if exists answers_freeze on public.quiz_answers;
create trigger answers_freeze
  before update on public.quiz_answers
  for each row execute function public.freeze_answers();

-- ------------------------------------------------------------ certificates --
drop policy if exists certificates_select_own   on public.certificates;
drop policy if exists certificates_admin_all    on public.certificates;

create policy certificates_select_own on public.certificates
  for select to authenticated using (profile_id = auth.uid());

create policy certificates_admin_all on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------- admin_users --
-- Readable so a signed-in user can discover their own admin status; writable
-- by nobody through the API (seed via SQL editor / service role only).
drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self on public.admin_users
  for select to authenticated using (user_id = auth.uid());

-- -------------------------------------------------------- workshop_settings --
drop policy if exists settings_select_all on public.workshop_settings;
drop policy if exists settings_admin_write on public.workshop_settings;

create policy settings_select_all on public.workshop_settings
  for select to authenticated using (true);

create policy settings_admin_write on public.workshop_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
