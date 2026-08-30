# Product Requirements Document

## 1. Product summary

Build a quiz and certificate platform for a college Web Development Workshop.

## 2. Users

### Student
- Sign in with Google.
- Confirm or edit name.
- Provide mobile number and branch.
- Take the quiz once.
- View result after submission.
- Return later and see the same saved result.
- Receive a certificate when eligible and sent by an admin.

### Admin
- Sign in through an admin-authorized account.
- View dashboard metrics.
- View and filter participants.
- View detailed quiz results.
- Manage quiz questions.
- Preview certificates.
- Send certificates to eligible students.
- Track certificate status.

## 3. Registration requirements

On first Google login, create or load a participant profile.

Fields:
- Google user ID, system managed.
- Name, prefilled from Google and editable.
- Email, taken from Google and read-only.
- Mobile number, required.
- Branch, required: Computer Science, Artificial Intelligence & Machine Learning, Electronics & Communication, Civil, or Mechanical.
- Year, defaulted to 1st Year and optionally locked by event rules.

## 4. Quiz requirements

- 30 questions total.
- 10 HTML, 10 CSS, 10 JavaScript.
- Four options per question.
- One correct option.
- Randomize question order only if the event team wants it.
- Do not reveal answers during the quiz.
- Save final answers and score on submission.
- Submission must be idempotent and blocked after completion.

## 5. Result requirements

Show:
- Total score out of 30.
- Percentage.
- HTML score out of 10.
- CSS score out of 10.
- JavaScript score out of 10.
- Certificate eligibility.
- Certificate status.

## 6. Certificate rules

- Eligible: percentage >= 70.
- Not eligible: percentage < 70.
- Only admins can send certificates.
- Certificate uses the participant's confirmed name.
- Certificate delivery should be auditable.

## 7. Non-functional requirements

- Mobile responsive.
- Accessible contrast and keyboard navigation.
- Server-side authorization for admin routes.
- Database row-level security enabled.
- Never trust frontend score or certificate eligibility values.
- Never expose correct answers to the browser before submission.
