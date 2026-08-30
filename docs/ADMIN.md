# Admin Dashboard Specification

## Access

Only users listed in `admin_users` can access admin routes.

Never rely on a frontend-only admin flag.

## Dashboard

Show:
- Total registered students.
- Total completed quizzes.
- Total eligible students.
- Certificates sent.
- Average score.

## Participants

Features:
- Search by name or email.
- Filter by branch.
- Filter by completed status.
- Filter by certificate eligibility.
- Sort by score or submission time.
- Open participant details.

## Participant details

Show:
- Name.
- Email.
- Phone.
- Branch.
- Year.
- Section scores.
- Total score.
- Percentage.
- Submission time.
- Certificate status.

## Certificates

Show eligible participants first.

Actions:
- Preview.
- Generate.
- Send.
- Retry failed send.
- View sent timestamp.

The Send button should be disabled or guarded when:
- Student is below 70%.
- Certificate is already sent unless a resend action is explicitly supported.

## Questions

Admin can:
- Add question.
- Edit question.
- Disable question.
- Review correct answer.
- Filter by category.

Avoid editing live questions in a way that changes the meaning of an already completed attempt.
