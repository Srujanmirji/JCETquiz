-- ============================================================================
-- 0008_four_quiz_architecture.sql
--
-- Replaces the single 30-question quiz with four 10-question quizzes that the
-- INSTRUCTOR opens and closes as the workshop progresses.
--
--   HTML → CSS → JavaScript → Python,  10 questions each,  40 total
--   Certificate threshold: 28/40 (70%)
--
-- Access model (decided with the organiser):
--   A student may attempt a quiz when its SESSION IS OPEN and they have no
--   attempt for it. There is deliberately no "must have completed the previous
--   quiz" rule — the session control already enforces the order for the whole
--   room, and a per-student rule would permanently lock out anyone who arrives
--   late. A missed quiz simply scores zero.
--
-- Safe as a clean rebuild: verified 0 profiles / 0 attempts / 0 answers /
-- 0 certificates before writing this.
-- ============================================================================

-- ---------------------------------------------------------------- teardown --
drop function if exists public.submit_quiz(uuid, jsonb)        cascade;
drop function if exists public.start_attempt(uuid)             cascade;
drop function if exists public.admin_dashboard()               cascade;
drop function if exists public.protect_answered_questions()    cascade;
drop function if exists public.block_answered_question_delete() cascade;
drop function if exists public.freeze_completed_attempt()      cascade;
drop function if exists public.freeze_answers()                cascade;
drop function if exists public.enforce_certificate_ownership() cascade;
drop function if exists public.freeze_certificate_identity()   cascade;
drop view     if exists public.public_questions                cascade;

drop table if exists public.certificates    cascade;
drop table if exists public.quiz_answers    cascade;
drop table if exists public.quiz_attempts   cascade;
drop table if exists public.quiz_questions  cascade;

-- ----------------------------------------------------------------- quizzes --
create table public.quizzes (
  id             uuid primary key default gen_random_uuid(),
  slug           text    not null unique check (slug in ('html','css','javascript','python')),
  title          text    not null,
  subtitle       text,
  question_count integer not null default 10 check (question_count > 0),
  order_index    integer not null unique,
  -- The instructor's control. 'locked' before the session, 'open' during it,
  -- 'closed' afterwards. Only an open quiz accepts new attempts.
  session_state  text    not null default 'locked'
                   check (session_state in ('locked','open','closed')),
  opened_at      timestamptz,
  closed_at      timestamptz,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

comment on column public.quizzes.session_state is
  'Instructor-driven. Students can only attempt a quiz while this is ''open''.';

-- --------------------------------------------------------------- questions --
create table public.questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid    not null references public.quizzes(id) on delete cascade,
  question_text  text    not null,
  options        jsonb   not null check (
                   jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4
                 ),
  correct_option integer not null check (correct_option between 0 and 3),
  explanation    text,
  is_active      boolean not null default true,
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  unique (quiz_id, position)
);

comment on column public.questions.correct_option is
  'NEVER exposed to a student. They read public.public_questions, a view whose
   projection does not contain this column, and the column grant is revoked.';

create index questions_quiz_idx on public.questions (quiz_id, is_active, position);

-- ----------------------------------------------------------- quiz_attempts --
create table public.quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  quiz_id         uuid not null references public.quizzes(id)  on delete cascade,
  status          text not null default 'started' check (status in ('started','completed')),
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz,
  score           integer check (score >= 0),
  total_questions integer check (total_questions > 0),
  percentage      numeric(5,2) check (percentage between 0 and 100),

  -- THE one-attempt-per-quiz rule, enforced by the database.
  unique (profile_id, quiz_id),

  constraint completed_attempt_is_scored check (
    (status = 'started'   and submitted_at is null and score is null)
    or
    (status = 'completed' and submitted_at is not null and score is not null
     and total_questions is not null and percentage is not null)
  )
);

create index quiz_attempts_quiz_idx    on public.quiz_attempts (quiz_id, status);
create index quiz_attempts_profile_idx on public.quiz_attempts (profile_id);

-- ------------------------------------------------------------ quiz_answers --
create table public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid    not null references public.quiz_attempts(id) on delete cascade,
  question_id     uuid    not null references public.questions(id)     on delete restrict,
  selected_option integer          check (selected_option between 0 and 3),
  is_correct      boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index quiz_answers_attempt_idx on public.quiz_answers (attempt_id);

-- ----------------------------------------------------------- final_results --
-- Derived, never hand-written: recompute_final_result() is the only writer.
create table public.final_results (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid not null unique references public.profiles(id) on delete cascade,
  html_score           integer not null default 0,
  css_score            integer not null default 0,
  javascript_score     integer not null default 0,
  python_score         integer not null default 0,
  total_score          integer not null default 0,
  total_questions      integer not null default 40,
  percentage           numeric(5,2) not null default 0,
  quizzes_completed    integer not null default 0,
  certificate_eligible boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index final_results_eligible_idx on public.final_results (certificate_eligible, total_score desc);

-- ------------------------------------------------------------ certificates --
create table public.certificates (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null unique references public.profiles(id) on delete cascade,
  final_result_id    uuid not null references public.final_results(id) on delete cascade,
  certificate_name   text not null,
  certificate_number text not null unique,
  file_path          text,
  status             text not null default 'eligible'
                       check (status in ('eligible','generated','sending','sent','failed')),
  last_error         text,
  sent_at            timestamptz,
  sent_by            uuid references auth.users(id),
  email              text,
  created_at         timestamptz not null default now()
);

create index certificates_status_idx on public.certificates (status);

-- ------------------------------------------------------- public_questions --
-- The only question surface a student may read. No correct_option in the
-- projection, so it cannot leak even through a misconfigured policy.
create view public.public_questions
with (security_invoker = true) as
  select q.id, q.quiz_id, z.slug as quiz_slug, q.question_text, q.options, q.position
  from public.questions q
  join public.quizzes z on z.id = q.quiz_id
  where q.is_active and z.is_active;

-- ------------------------------------------------------------- seed quizzes --
insert into public.quizzes (slug, title, subtitle, question_count, order_index, session_state) values
  ('html',       'HTML Quiz',       'Structure',  10, 1, 'locked'),
  ('css',        'CSS Quiz',        'Styling',    10, 2, 'locked'),
  ('javascript', 'JavaScript Quiz', 'Behaviour',  10, 3, 'locked'),
  ('python',     'Python Quiz',     'Programming',10, 4, 'locked')
on conflict (slug) do nothing;
