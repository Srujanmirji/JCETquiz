# UI Design System

## Design direction

Modern glassmorphism + dark tech.

## Visual rules

- Deep black/navy base background.
- Blue and violet ambient gradients.
- Translucent cards with backdrop blur.
- Thin light borders.
- Rounded corners around 14 to 20px.
- High-contrast text.
- Soft shadows and subtle glow.
- Use glass effects mainly for cards and surfaces.
- Keep tables and dense admin data simpler for readability.

## Typography

Prefer Inter or Geist.

Use strong hierarchy:
- Large page title.
- Medium section headings.
- Compact supporting text.

## Student pages

### Login

Centered glass card.

Content:
- Workshop logo.
- `Web Development Workshop`.
- Short description.
- Google login button.

### Registration

Fields:
- Name, editable and prefilled.
- Email, disabled/read-only.
- Mobile number.
- Branch dropdown.
- Year.
- Continue button.

### Quiz

Layout:
- Workshop name.
- Progress indicator.
- Question card.
- Four large option buttons.
- Previous and Next.
- Submit Quiz on final question.

Do not use excessive animation. Keep the quiz focused.

### Result

Large score such as:

`24 / 30`

`80%`

Show category scores and certificate state.

Eligible copy:

`Certificate Eligible`

Not eligible copy:

`Certificate Not Eligible`

Avoid language that embarrasses students.

## Admin pages

Sidebar:
- Dashboard
- Participants
- Quiz Results
- Certificates
- Questions
- Settings

Dashboard KPI cards:
- Total Participants
- Completed
- Eligible
- Certificates Sent

Participant table:
- Name
- Email
- Branch
- Score
- Percentage
- Status
- Certificate

## Responsive behavior

- Mobile-first.
- Quiz answers should be easy to tap.
- Tables become cards or horizontally scroll when needed.
- Admin dashboard should remain usable on laptop and tablet.
