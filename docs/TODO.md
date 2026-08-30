# Build Checklist

## Four-quiz workshop — built and verified

- [x] Schema: `quizzes`, `questions`, `quiz_attempts`, `final_results`, `certificates` (0008)
- [x] Lifecycle functions: sessions, start, submit, final result, analytics, reset (0009)
- [x] RLS + grants for every new table (0010)
- [x] Trigger functions removed from the REST surface (0011)
- [x] 40 seeded questions — 10 each HTML / CSS / JavaScript / Python
- [x] Instructor session control: start · end · force close · reopen
- [x] One attempt per quiz — `UNIQUE(profile_id, quiz_id)`
- [x] Student dashboard with completed / available / locked / missed states
- [x] Per-quiz flow and per-quiz result
- [x] Final result on /40, gated on all sessions closed
- [x] Admin: 4 score columns, per-quiz analytics, participant detail, attempt reset
- [x] Certificate covers Python, prints the score out of 40
- [x] `npm run test` — 19 logic tests
- [x] `npm run verify:db` — 23 end-to-end checks against the live database

## Before the event

- [x] Apply `20260830160253_answer_review.sql` to the Quiz Supabase project; verify server-only RPC access and closed-session gates (isolated PostgreSQL tests plus live permission/REST checks).
- [ ] Add `http://localhost:3000/auth/callback` (and the production URL) under
      Auth → URL Configuration
- [ ] Sign in with an organiser account to confirm admin auto-promotion
- [ ] Fill in `/admin/settings` (college, event date, organiser)
- [ ] Verify a sending domain in Resend and set `RESEND_API_KEY` + `EMAIL_FROM`
- [ ] Send one test certificate to an organiser
- [ ] Rehearse the session flow: open HTML → students submit → end → open CSS → …
- [ ] Deploy, then re-check the production OAuth redirect URL
