# Implementation Plan

## Phase 1, foundation

- Create Next.js app.
- Configure Tailwind.
- Configure Supabase client/server utilities.
- Configure Google login.
- Build dark glassmorphism design system.

## Phase 2, student registration

- Auth callback.
- Profile creation.
- Registration form.
- Name prefill and edit.
- Phone validation.
- Branch dropdown.

## Phase 3, quiz

- Seed 30 questions.
- Question API/server action.
- Quiz UI.
- Progress bar.
- Answer selection.
- Navigation.
- Submit flow.
- Server scoring.
- One-time attempt protection.

## Phase 4, result

- Score card.
- Percentage.
- Section scores.
- Eligibility state.
- Returning-login result behavior.

## Phase 5, admin

- Admin authorization.
- Dashboard.
- Participant table.
- Filters.
- Result details.
- Question management.

## Phase 6, certificates

- Certificate template.
- PDF generation.
- Supabase Storage integration.
- Resend integration.
- Send and retry workflow.
- Delivery tracking.

## Phase 7, QA

Test edge cases:
- Student closes browser during quiz.
- Student refreshes.
- Student submits twice.
- Student opens quiz in two tabs.
- Student logs in on another device.
- Admin sends the same certificate twice.
- Student score exactly 70%.
- Student score exactly 69.99% if fractional values are ever introduced.
- Question is disabled after some attempts.

## Event readiness

Freeze question content before the event.

Create a backup admin account.

Verify production OAuth redirect URLs.

Send a test certificate to organizers.

Test with at least 5 dummy student accounts before opening the quiz to the full batch.
