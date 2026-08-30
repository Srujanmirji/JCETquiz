# Local Setup

## 1. Create Supabase project

Create a Supabase project.

Enable:
- Auth.
- Google provider.
- PostgreSQL database.
- Storage.

## 2. Configure Google OAuth

Create Google OAuth credentials in Google Cloud.

Add the Supabase callback URL supplied by the Supabase Auth dashboard.

Add the local and production site URLs in the allowed redirect settings.

## 3. Environment variables

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.

## 4. Apply database migrations

Create the tables and constraints described in `DATABASE.md`.

Enable RLS on participant data tables.

## 5. Seed questions

Insert exactly 30 active questions:
- 10 HTML.
- 10 CSS.
- 10 JavaScript.

Verify every question has one valid correct option.

## 6. Create admin

Sign in once through Google, then insert the user's auth ID into `admin_users` using a secure admin process.

## 7. Test before event

Test:
- New Google login.
- Name editing.
- Phone and branch capture.
- Quiz start.
- Quiz submission.
- Duplicate submission blocking.
- Re-login showing result.
- 70% threshold.
- Certificate generation.
- Certificate email.
- Admin authorization.
- Mobile layout.
