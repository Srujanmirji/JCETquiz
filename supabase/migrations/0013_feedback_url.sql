-- A link to the workshop feedback form (a Google Form), shown to students once
-- they finish all four quizzes and included in the certificate email.
--
-- Deliberately a setting rather than a hardcoded constant: the organisers can
-- paste the form URL on event day without waiting for a redeploy, and clearing
-- it hides the prompt everywhere at once.
alter table public.workshop_settings
  add column if not exists feedback_url text;

comment on column public.workshop_settings.feedback_url is
  'Workshop feedback form URL. NULL or empty hides the feedback prompt.';
