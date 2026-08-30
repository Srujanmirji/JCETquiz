# Web Development Workshop Quiz Platform

A two-day college workshop platform for first-year students.

## Goal

Students authenticate with Google, complete a one-time 30-question quiz covering HTML, CSS, and JavaScript, receive an automatic result, and become certificate-eligible at 70% or above.

Admins manage participants, results, questions, and certificate delivery.

## Design

Modern glassmorphism + dark tech design.

## Recommended stack

- Frontend: Next.js + TypeScript
- UI: Tailwind CSS
- Backend/data: Supabase
- Authentication: Supabase Auth with Google provider
- Database: Supabase PostgreSQL
- Storage: Supabase Storage for generated certificates
- Email: Google Apps Script (organisers' Gmail)
- PDF certificate generation: server-side HTML/PDF generation

## Core rules

- One Google account can register once.
- One registered student can submit the quiz only once.
- Quiz has exactly 30 questions: 10 HTML, 10 CSS, 10 JavaScript.
- Each question has four options and one correct answer.
- Score is out of 30.
- Percentage = score / 30 * 100.
- Certificate eligibility starts at 70%, which means 21/30 or higher.
- After completion, future logins show the saved result instead of the quiz.

---

## Running it

```bash
npm install
cp .env.example .env.local     # then fill in the values
npm run dev
```

### Setting up Supabase

1. Create a project, enable the **Google** provider under Authentication → Providers.
2. In the SQL editor, run the files in `supabase/migrations/` **in order**, then `supabase/seed.sql`.
3. Add your redirect URLs: `http://localhost:3000/auth/callback` and the production equivalent.
4. Sign in once with Google, then make yourself an admin:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'you@yourcollege.edu';
   ```

5. Open `/admin/settings` and set the college name, event date, and organiser — these are
   printed on every certificate. Use **Preview a sample certificate** to check them.

Full walkthrough: [`docs/SETUP.md`](docs/SETUP.md).

## Verifying before the event

```bash
npm run test       # scoring rules, the 21/30 boundary, question bank shape
npm run verify:db  # the real thing: one-attempt rule, RLS, concurrency, storage
```

`verify:db` creates a few throwaway users against your actual Supabase project, exercises
every rule that lives in the database, and deletes them again. Run it once after setup and
once more the morning of the event.

## Project layout

```
docs/                    product specification — the source of truth
supabase/migrations/     schema, RLS, triggers, the scoring function
supabase/seed.sql        the 30 questions
src/app/                 routes (student flow, admin, API)
src/components/          UI, grouped by feature
src/lib/                 supabase clients, guards, quiz service, certificates, email
tests/                   pure logic tests (no credentials needed)
scripts/verify-db.ts     end-to-end database verification
```

## How the one-attempt rule is enforced

Three independent layers, so no single mistake lets a student retake the quiz:

1. **Database** — `UNIQUE(quiz_attempts.profile_id)`, plus triggers that reject any update to
   a completed attempt or a recorded answer.
2. **RLS** — students can read their own rows and nothing else. They hold no insert or update
   path into attempts, answers, or certificates, and `correct_option` is not reachable with
   the anon key at all.
3. **Server** — `/quiz` re-checks completion against the database on every render, and
   `submit_quiz()` takes a row lock so two tabs cannot both succeed.

The browser never sends a score. It sends `{questionId, selectedOption}` pairs, and the
database grades them against its own answer key.

# JCETquiz

## Certificate email (Google Apps Script)

Certificates are sent from the organisers' own Gmail through an Apps Script web
app — no sending domain to verify, and students recognise the address.

1. **script.google.com** → New project → paste [`scripts/apps-script/Code.gs`](scripts/apps-script/Code.gs)
2. Replace `SHARED_SECRET` with a long random string
3. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise (it warns "unverified" — it's your own script; continue via Advanced)
5. Put the `/exec` URL and the same secret in `.env.local`:

   ```
   APPS_SCRIPT_URL=https://script.google.com/macros/s/…/exec
   APPS_SCRIPT_SECRET=the-same-long-random-string
   ```

Open the `/exec` URL in a browser to check it works — it returns today's
remaining quota.

### The quota matters

| Account type | Recipients per day |
|---|---|
| Consumer `@gmail.com` | **100** |
| Google Workspace | **1,500** |

The admin Certificates page shows what's left today and warns when you have
more certificates pending than quota remaining. If the workshop is larger than
100 students, run the script from a Workspace account.
