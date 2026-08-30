-- Security hardening: bind certificate identity, serialize delivery, and
-- freeze student names once an attempt is completed.

alter table public.certificates
  add column if not exists certificate_name text;

update public.certificates c
set certificate_name = p.name
from public.profiles p
where p.id = c.profile_id
  and c.certificate_name is null;

alter table public.certificates
  alter column certificate_name set not null;

alter table public.certificates drop constraint if exists certificates_status_check;
alter table public.certificates
  add constraint certificates_status_check
  check (status in ('eligible', 'generated', 'sending', 'sent', 'failed'));

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

create or replace function public.enforce_certificate_ownership()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.quiz_attempts
    where id = new.attempt_id and profile_id = new.profile_id
  ) then
    raise exception 'certificate profile does not own attempt' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists certificates_enforce_ownership on public.certificates;
create trigger certificates_enforce_ownership
  before insert or update on public.certificates
  for each row execute function public.enforce_certificate_ownership();

create or replace function public.freeze_certificate_identity()
returns trigger language plpgsql as $$
begin
  if new.certificate_name is distinct from old.certificate_name then
    raise exception 'certificate identity is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists certificates_freeze_identity on public.certificates;
create trigger certificates_freeze_identity
  before update on public.certificates
  for each row execute function public.freeze_certificate_identity();
