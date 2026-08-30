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

## Privacy

Collect only the information required for the workshop and certificates.

Avoid logging phone numbers, OAuth tokens, or full answer payloads unnecessarily.

## Certificate security

Use private storage and signed URLs where possible.

Do not allow a student to alter certificate name, score, or eligibility from the client.
Snapshot the certificate name when eligibility is recorded and keep that snapshot immutable.
