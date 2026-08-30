# API and Server Actions

The frontend can use Next.js route handlers or server actions. Keep all scoring and admin-sensitive operations server-side.

## Auth

`POST /api/auth/profile`

Creates or updates a participant profile after Google login.

## Quiz

`GET /api/quiz`

Returns active questions without correct answers.
When the workshop is closed, question fetches and submissions are rejected with a conflict.

`POST /api/quiz/start`

Creates a quiz attempt only if the student has not completed one.

`POST /api/quiz/submit`

Accepts selected answers. Server validates question IDs, fetches correct answers, calculates scores, stores answers, and completes the attempt in one transaction-like flow.

Return:

```json
{
  "score": 24,
  "percentage": 80,
  "htmlScore": 9,
  "cssScore": 8,
  "javascriptScore": 7,
  "certificateEligible": true
}
```

`GET /api/results/me`

Returns the participant's saved result.

## Admin

`GET /api/admin/dashboard`

Returns dashboard metrics.

`GET /api/admin/participants`

Returns paginated participants with filters.

`GET /api/admin/participants/:id`

Returns profile, attempt, score, and certificate information.

`POST /api/admin/certificates/:id/generate`

Generates and stores a PDF certificate.

`POST /api/admin/certificates/:id/send`

Sends the generated certificate by email and records the outcome.

## Error cases

- Already completed quiz: return a conflict and send the client to results.
- Quiz closed: reject question fetch and submission.
- Invalid question IDs: reject submission.
- Missing answer: define whether unanswered questions count as zero. Recommended: yes.
- Unauthorized admin: return 403.
- Certificate requested for ineligible student: return 409.
