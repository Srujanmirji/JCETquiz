-- ============================================================================
-- 0007_admin_email_allowlist.sql
--
-- admin_users.user_id references auth.users(id), which does not exist until a
-- person has actually signed in with Google. This allowlist lets organisers be
-- named up front; a trigger promotes them the moment they first sign in.
-- ============================================================================

create table if not exists public.admin_emails (
  email      text primary key,
  note       text,
  created_at timestamptz not null default now(),
  constraint admin_emails_lowercase check (email = lower(email))
);

alter table public.admin_emails enable row level security;

-- Readable only by existing admins; never writable through the API.
drop policy if exists admin_emails_select_admin on public.admin_emails;
create policy admin_emails_select_admin on public.admin_emails
  for select to authenticated using (public.is_admin());

create or replace function public.promote_allowlisted_admin()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if new.email is not null
     and exists (select 1 from public.admin_emails where email = lower(new.email)) then
    insert into public.admin_users (user_id) values (new.id)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists auth_users_promote_admin on auth.users;
create trigger auth_users_promote_admin
  after insert on auth.users
  for each row execute function public.promote_allowlisted_admin();

-- Backfill anyone who has already signed in.
insert into public.admin_users (user_id)
select u.id from auth.users u
join public.admin_emails a on a.email = lower(u.email)
on conflict (user_id) do nothing;

-- Workshop organisers.
insert into public.admin_emails (email, note) values
  ('thakkarnirali31@gmail.com',    'organiser'),
  ('srujanmirji10@gmail.com',      'organiser'),
  ('developersclub.jcet@gmail.com','Developers Club JCET')
on conflict (email) do nothing;
