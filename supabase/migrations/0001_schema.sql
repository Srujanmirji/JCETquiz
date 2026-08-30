-- ============================================================================
-- 0001_schema.sql — tables, constraints, indexes
-- Follows docs/DATABASE.md.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- profiles --
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text        not null check (length(btrim(name)) between 2 and 80),
  email       text        not null unique,
  phone       text        not null check (phone ~ '^[0-9]{10}$'),
  branch      text        not null check (length(btrim(branch)) > 0),
  year        text        not null default '1st Year',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated Google account. id === auth.users.id, so a second
   profile for the same Google account is impossible by construction.';

-- --------------------------------------------------------- quiz_questions --
create table if not exists public.quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  category       text    not null check (category in ('HTML', 'CSS', 'JavaScript')),
  question_text  text    not null,
  options        jsonb   not null check (
                   jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4
                 ),
  correct_option integer not null check (correct_option between 0 and 3),
  explanation    text,
  is_active      boolean not null default true,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);

comment on column public.quiz_questions.correct_option is
  'NEVER exposed to the student client. Students read public.public_questions,
   a view that does not contain this column at all.';

create index if not exists quiz_questions_active_idx
  on public.quiz_questions (is_active, category, position);

-- ---------------------------------------------------------- quiz_attempts --
create table if not exists public.quiz_attempts (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid not null unique references public.profiles(id) on delete cascade,
  status               text not null default 'started' check (status in ('started', 'completed')),
  started_at           timestamptz not null default now(),
  submitted_at         timestamptz,
  html_score           integer check (html_score       between 0 and 10),
  css_score            integer check (css_score        between 0 and 10),
  javascript_score     integer check (javascript_score between 0 and 10),
  total_score          integer check (total_score      between 0 and 30),
  percentage           numeric(5,2) check (percentage  between 0 and 100),
  certificate_eligible boolean not null default false,

  -- A completed attempt must carry a full result set; a started one must not.
  constraint completed_attempt_is_scored check (
    (status = 'started'   and submitted_at is null and total_score is null)
    or
    (status = 'completed' and submitted_at is not null and total_score is not null
     and html_score is not null and css_score is not null
     and javascript_score is not null and percentage is not null)
  )
);

comment on constraint quiz_attempts_profile_id_key on public.quiz_attempts is
  'THE one-time-quiz rule. One attempt row per participant, enforced by the
   database — not by the UI, not by the API layer.';

create index if not exists quiz_attempts_status_idx on public.quiz_attempts (status, total_score desc);

-- ----------------------------------------------------------- quiz_answers --
create table if not exists public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid    not null references public.quiz_attempts(id) on delete cascade,
  question_id     uuid    not null references public.quiz_questions(id) on delete restrict,
  selected_option integer          check (selected_option between 0 and 3), -- null = unanswered
  is_correct      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists quiz_answers_attempt_idx on public.quiz_answers (attempt_id);

-- ----------------------------------------------------------- certificates --
create table if not exists public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  attempt_id         uuid not null unique references public.quiz_attempts(id) on delete cascade,
  certificate_number text not null unique,
  file_path          text,
  status             text not null default 'eligible'
                       check (status in ('eligible', 'generated', 'sent', 'failed')),
  last_error         text,
  sent_at            timestamptz,
  sent_by            uuid references auth.users(id),
  created_at         timestamptz not null default now()
);

create index if not exists certificates_status_idx on public.certificates (status);

-- Certificate numbers come from a sequence, not a hash of the attempt id.
-- A hash mod 100000 collides with ~20% probability across only 200 students,
-- and a collision on the UNIQUE(certificate_number) constraint would abort the
-- student's whole quiz submission.
create sequence if not exists public.certificate_number_seq start 1;

-- ------------------------------------------------------------ admin_users --
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------- settings --
-- Single-row table backing the admin Settings screen. Feeds the certificate
-- template placeholders required by docs/CERTIFICATES.md.
create table if not exists public.workshop_settings (
  id                  boolean primary key default true check (id),
  college_name        text not null default 'Your College Name',
  workshop_name       text not null default 'Web Development Workshop',
  event_date          date not null default current_date,
  organizer_name      text not null default 'Workshop Organizer',
  organizer_title     text not null default 'Faculty Coordinator',
  certificate_prefix  text not null default 'WDW',
  quiz_open           boolean not null default true,
  randomize_questions boolean not null default false,
  lock_year           boolean not null default true,
  updated_at          timestamptz not null default now()
);

insert into public.workshop_settings (id) values (true) on conflict (id) do nothing;

-- ------------------------------------------------------- public_questions --
-- The ONLY question surface a student may read. correct_option is absent from
-- the projection, so it cannot leak even if a policy were misconfigured.
create or replace view public.public_questions
with (security_invoker = true) as
  select id, category, question_text, options, position
  from public.quiz_questions
  where is_active = true;

-- ------------------------------------------------------------- updated_at --
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
