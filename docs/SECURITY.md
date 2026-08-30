# Security and Integrity

## Authentication

Use Supabase Auth with Google.

## Authorization

Use RLS and server-side checks.

## One-attempt enforcement

The database must enforce one attempt per participant. Use a unique constraint on `quiz_attempts.profile_id` and reject duplicate starts/submissions server-side.

## Score integrity

Never accept a client-provided score or percentage as authoritative.

The server should:
1. Validate the submitted question IDs.
2. Validate selected option indexes.
3. Fetch correct answers from the database.
4. Calculate each category score.
5. Calculate total score.
6. Calculate percentage.
7. Set certificate eligibility.
8. Persist the result.

## Answer integrity

Prevent updates to completed attempts and answers.

## Post-session answer disclosure

`public_questions` and browser-facing `questions` column grants remain answer-key-free.
The only student review path is the dynamic `/result/[slug]` server page calling
`quiz_answer_review(uuid, text)` with the verified user's ID. The browser cannot supply
another student's ID or call the RPC directly: execution is revoked from `PUBLIC`,
`anon`, and `authenticated`, and granted only to `service_role`.

The RPC is `STABLE SECURITY INVOKER` with an empty search path and qualified tables.
It checks the student's completed attempt, active quiz, closed session, and absence of
in-flight attempts using one statement snapshot before projecting any correct answer
or explanation. Locked responses contain an empty question list. Errors fail closed
without hiding the student's saved score. No shared caching or client-side answer
filter is used. Already disclosed information cannot be revoked by reopening a quiz.

`npm test` runs these gates against isolated PostgreSQL (PGlite), including role grants,
open/closed/reopened sessions, unfinished attempts, force-close, and reset behavior.
It does not modify live sessions. The existing `verify:db` script does modify session
state and should only be used when that is safe for the event.

## Privacy

Collect only the information required for the workshop and certificates.

Avoid logging phone numbers, OAuth tokens, or full answer payloads unnecessarily.

## Certificate security

Use private storage and signed URLs where possible.

Do not allow a student to alter certificate name, score, or eligibility from the client.
Snapshot the certificate name when eligibility is recorded and keep that snapshot immutable.
