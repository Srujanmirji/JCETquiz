-- ============================================================================
-- 0012_certificate_content.sql
--
-- The certificate names the club above the college, and the workshop runs over
-- two days — the existing single event_date could not express "August 31 and
-- September 1". Adds the club line and an optional end date.
-- ============================================================================

alter table public.workshop_settings
  add column if not exists club_name      text not null default 'Developer''s Club',
  add column if not exists event_end_date date;

comment on column public.workshop_settings.event_end_date is
  'Optional. When set, the certificate prints a date range; otherwise a single date.';

update public.workshop_settings
set club_name       = 'Developer''s Club',
    college_name    = 'Jain College of Engineering and Technology, Hubli',
    workshop_name   = 'Web Development Workshop',
    event_date      = date '2026-08-31',
    event_end_date  = date '2026-09-01',
    organizer_name  = coalesce(nullif(organizer_name, 'Workshop Organizer'), 'Developer''s Club'),
    organizer_title = coalesce(nullif(organizer_title, 'Faculty Coordinator'), 'Faculty Coordinator')
where id = true;
