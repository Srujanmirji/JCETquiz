# Quiz Specification

## Structure

30 easy beginner questions.

- HTML: 10
- CSS: 10
- JavaScript: 10

## Difficulty

Target first-year students with basic exposure to web development.

Questions should test fundamentals rather than syntax tricks.

## HTML topics

- HTML document structure.
- Headings and paragraphs.
- Links.
- Images.
- Lists.
- Buttons.
- Forms.
- Common semantic tags.
- Attributes.
- Basic input types.

## CSS topics

- Selectors.
- Colors.
- Fonts.
- Backgrounds.
- Margin and padding.
- Borders.
- Width and height.
- Display.
- Flexbox basics.
- Responsive basics.

## JavaScript topics

- Variables.
- Basic data types.
- Operators.
- Conditions.
- Functions.
- Arrays basics.
- Events.
- DOM basics.
- `let` and `const` basics.
- Console usage.

## Question format

Each question should contain:
- Question text.
- Four options.
- One correct option.
- Category.
- Short explanation for post-session student review (optional for custom questions).

## Answer review

- Each submitted topic result (`/result/[slug]`) includes an answer-review section; the final result links back to each completed topic.
- Release answers only when that quiz is active, its session is `closed`, the signed-in student has submitted, and no attempt for that quiz is still `started`.
- Closing a session currently lets in-flight students finish. Review therefore waits for them to submit, or for the instructor to force-close remaining attempts.
- `quiz_answer_review(profile_id, slug)` checks eligibility in PostgreSQL and returns only that student's graded question rows, selected answers, correct answers, and explanations.
- Incorrect and unanswered questions are labelled explicitly. Missing explanations invite the student to ask the instructor; do not invent an explanation.
- Disabled questions already graded remain in the review; newly added questions do not appear in older attempts.
- Open, locked, incomplete, or failed requests return no answer key. Reopening blocks subsequent review requests, but cannot retract answers a student has already seen; use reopening with care.
- Review is read-only and does not change the student's score or grant another attempt.

## Scoring

Each correct answer = 1 point.

Maximum = 30.

Percentage = `(score / 30) * 100`.

Certificate threshold = 21/30.
