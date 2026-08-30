# Supabase Architecture

## Authentication

Use Supabase Auth with Google OAuth.

The Google account is the identity for the participant. Store the Supabase auth user ID in the participant record.

Email should be read from the authenticated user and not editable in the registration form.

## Database

Recommended tables:

- `profiles`
- `quiz_questions`
- `quiz_attempts`
- `quiz_answers`
- `certificates`
- `admin_users`

## Storage

Create a private bucket named `certificates`.

Store generated PDFs under a predictable path, for example:

`certificates/{participant_id}/{certificate_id}.pdf`

Use signed URLs for temporary downloads. Do not make the bucket public unless there is a deliberate event requirement.

## Server-side responsibilities

Use Supabase server-side access for:
- Creating a quiz attempt.
- Validating that the participant has not already completed the quiz.
- Fetching correct answers during scoring.
- Calculating score and percentage.
- Determining certificate eligibility.
- Creating certificate records.
- Generating signed URLs.
- Authorizing admin actions.

## RLS principles

### Profiles
Participants can read and update their own profile. They cannot change their user ID or email.

### Questions
Participants can read active questions and public question fields, but never correct answers.

### Attempts
Participants can read their own completed attempt. They cannot edit a completed attempt.

### Answers
Participants can create answers only for their own active attempt. After submission, prevent updates.

### Certificates
Participants can read their own certificate status. Only authorized admins can create or mark certificates as sent.

## Important security rule

Do not ship `correct_option` to the student frontend. The browser should receive only question text and public options.
