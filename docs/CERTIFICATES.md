# Certificate System

## Eligibility

A student is eligible when the final score is at least 21/30, which is 70%.

Eligibility must be calculated on the server.

## Certificate content

Recommended content:

Certificate of Achievement

This certifies that

`[STUDENT NAME]`

successfully completed the Web Development Workshop covering HTML, CSS, and JavaScript.

Score: `[SCORE]/30`
Percentage: `[PERCENTAGE]%`

Date: `[EVENT DATE]`
Institution: `[COLLEGE NAME]`
Certificate ID: `[CERTIFICATE NUMBER]`

Organizer name/signature and college or club logo can be placed at the bottom.

## Certificate workflow

1. Student finishes with 70% or above.
2. System marks `certificate_eligible = true`.
3. Admin opens Certificates.
4. Admin previews certificate.
5. Admin generates PDF.
6. PDF is stored in Supabase Storage.
7. Admin clicks Send Certificate.
8. Email provider sends the PDF or a secure certificate link.
9. System records status and timestamp.

## Email

Subject example:

`Your Web Development Workshop Certificate`

The email should contain the student's name, achievement message, event name, and certificate attachment or secure link.

## Audit

Store:
- Certificate ID.
- Eligible attempt.
- Generated file path.
- Admin who sent it.
- Sent timestamp.
- Delivery status.
