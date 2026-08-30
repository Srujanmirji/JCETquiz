# User Flows

## Student first visit

1. Open workshop website.
2. Click `Continue with Google`.
3. Complete Google authentication.
4. System creates or loads participant profile.
5. Show registration form.
6. Pre-fill name from Google.
7. Keep Google email read-only.
8. Student can edit name.
9. Student enters phone and selects branch.
10. Save profile.
11. Show `Start Quiz`.

## Student quiz

1. Load 30 questions.
2. Show progress such as `Question 7 of 30`.
3. Student selects one option.
4. Student can navigate back and forward.
5. Final screen asks for submission.
6. Server validates the attempt.
7. Server fetches correct answers.
8. Server calculates section scores and total score.
9. Server calculates percentage.
10. Server sets eligibility.
11. Mark attempt completed.
12. Redirect to result.

## Student returns after completion

1. Google login.
2. Load participant profile.
3. Detect completed attempt.
4. Do not show quiz.
5. Show saved result page.
6. Show certificate status.

## Admin flow

1. Admin signs in.
2. Server verifies membership in `admin_users`.
3. Show dashboard.
4. Admin opens participants or certificates.
5. Filter eligible students.
6. Preview certificate.
7. Generate PDF if needed.
8. Send email.
9. Save sent status and timestamp.
