# Web Development Workshop Quiz Platform

The `docs/*.md` files are the product source of truth — read the relevant one before
changing behaviour. The application is built; `docs/` still governs what it must do.

| Doc | Owns |
|---|---|
| `docs/PRD.md`, `README.md` | Product scope and core rules |
| `docs/UI-DESIGN.md` | **Visual direction — this is the brief, it wins** |
| `docs/USER-FLOWS.md` | Screen-by-screen flow |
| `docs/DATABASE.md`, `docs/SUPABASE.md` | Schema, RLS, auth |
| `docs/API.md`, `docs/ADMIN.md`, `docs/CERTIFICATES.md`, `docs/QUIZ.md` | Feature contracts |
| `docs/SECURITY.md`, `docs/SETUP.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/TODO.md` | Ops and sequencing |

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind v4 · Radix primitives ·
Supabase (Auth + Postgres + Storage) · Resend · `@react-pdf/renderer` for certificates.

**Where the rules actually live** — change them here, not in a component:

| Rule | Enforced in |
|---|---|
| One attempt per student | `UNIQUE(quiz_attempts.profile_id)` + `start_attempt()` |
| Scoring and eligibility | `submit_quiz()` in `supabase/migrations/0003_functions.sql` |
| Answer key confidentiality | `public.public_questions` view + column grants in `0002_rls.sql` |
| Graded work is immutable | `freeze_completed_attempt` / `freeze_answers` triggers |
| Where a signed-in student belongs | `src/lib/auth/route.ts` |
| Admin authorisation | `requireAdmin()` / `requireAdminApi()`, re-run every request |

Never move a decision from the database into a component. `npm run verify:db` proves these
still hold.

Global frontend standards live in `~/.Codex/AGENTS.md`. This file adds the project's
specifics and resolves one conflict with them.

## Design direction — resolved

`docs/UI-DESIGN.md` specifies **glassmorphism + dark tech**: deep black/navy base, blue and violet
ambient gradients, translucent blurred cards, thin light borders, 14–20px radii, soft glow.

The global rules warn against gradients, glow, and uniformly rounded cards as *AI-SaaS
defaults*. That warning does not override this brief — a pinned direction always wins. It
does set the bar for executing it: this must read as a designed glassmorphism system, not as
the generic version of one.

**Execute it, don't dilute it. Concretely:**

- The blue/violet ambient gradient is **atmosphere on the page background**, not a fill on
  buttons, cards, headings, and borders as well. Pick one place it appears in the foreground.
- Glass is for **cards and elevated surfaces only** — per `docs/UI-DESIGN.md`, tables and dense
  admin data stay opaque and simple for readability.
- Vary radius by surface role (page-level panel > card > input > chip). One radius everywhere
  is the flat template look.
- Translucency destroys contrast. Measure text contrast against the **composited** background,
  not the token colour. 4.5:1 body minimum, in every scroll position over the gradient.
- Glow marks state (focus, correct/incorrect, eligible), it is not ambient decoration.
- Type: Inter or Geist, per the brief. Set a real scale and make the hierarchy come from
  scale contrast — large page title / medium section heading / compact support text.
- The signature element is the **result screen's score display** (`24 / 30`, `80%`). Spend the
  boldness there. Everything else stays quiet.

## Screen-specific rules

- **Quiz**: `docs/UI-DESIGN.md` says keep it focused with minimal animation. Honour that — the
  quiz gets state transitions only, no ambient motion. Option buttons are large, tappable
  (≥44px), keyboard-navigable, with distinct default/hover/focus/selected states.
- **Result**: never use language that embarrasses a student. "Certificate Not Eligible" is
  the ceiling of directness; pair it with a next step.
- **Admin**: readability over effect. Sidebar + data tables stay opaque. Tables become cards
  or scroll horizontally on mobile.

## Non-negotiables

- Mobile-first. Test 375 / 768 / 1280.
- Every data surface ships loading, empty, error, and populated states.
- One Google account registers once; one student submits once — enforce in the database
  (constraints + RLS), not only in the UI.
- Never expose the correct answer to the client before submission.
- WCAG 2.2 AA. Visible focus everywhere; `prefers-reduced-motion` respected.

## Workflow

1. Confirm the direction against `docs/UI-DESIGN.md` before building a new screen (Gate 1).
2. Build with the `frontend-ui` skill's implementation standard.
3. Run `/impeccable polish` and the responsive + keyboard pass before calling a screen done (Gate 2).
