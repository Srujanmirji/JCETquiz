import Link from "next/link"
import { Award, BookOpen, ArrowRight, MessageSquare, ExternalLink } from "lucide-react"
import type { FinalResult } from "@/types/database"
import { Panel } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import { PASS_SCORE } from "@/lib/constants"

/**
 * Shown once a student has finished all four quizzes.
 *
 * They get the verdict here rather than a neutral "waiting" line — by this
 * point the only thing they want to know is whether they earned the
 * certificate, and making them hunt for it is unkind.
 *
 * Copy rule (docs/UI-DESIGN.md): never embarrass a student. The not-eligible
 * case states the number plainly, then gives them something true to hold on to.
 */
export function CompletionCard({
  final,
  email,
  feedbackUrl,
}: {
  final: FinalResult
  email: string
  feedbackUrl?: string | null
}) {
  const eligible = final.certificate_eligible
  const pct = Number(final.percentage)

  return (
    <Panel className={eligible ? "bloom p-6 sm:p-7" : "p-6 sm:p-7"}>
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <span
          className={`grid size-12 shrink-0 place-items-center rounded-[var(--radius-input)] border ${
            eligible ? "border-ok/35 bg-ok/12" : "border-line bg-glass"
          }`}
        >
          {eligible ? (
            <Award className="size-5 text-ok" aria-hidden />
          ) : (
            <BookOpen className="size-5 text-ink-muted" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            All four quizzes complete
          </p>

          <h2 className="mt-1.5 text-xl font-semibold tracking-[-0.01em] text-ink sm:text-2xl">
            {eligible ? "Congratulations — you earned your certificate" : "Well done for finishing"}
          </h2>

          <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-ink-muted">
            You scored{" "}
            <span className="font-mono font-semibold text-ink">
              {final.total_score}/{final.total_questions}
            </span>{" "}
            ({pct % 1 === 0 ? pct : pct.toFixed(2)}%).{" "}
            {eligible ? (
              <>
                That clears the {PASS_SCORE}-mark threshold. The organisers will email your
                certificate to <span className="text-ink">{email}</span>.
              </>
            ) : (
              <>
                A certificate needs {PASS_SCORE} of {final.total_questions}, so this one falls
                short. You sat all four sessions though — and the HTML, CSS, JavaScript and Python
                you covered is exactly where every web project starts.
              </>
            )}
          </p>
        </div>

        <Button asChild variant={eligible ? "primary" : "secondary"} className="shrink-0">
          <Link href="/result">
            See full result
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      {/* Asked here because this is the moment they are still in the room and
          still thinking about the session. An email tomorrow gets ignored. */}
      {feedbackUrl ? (
        <div className="mt-5 border-t border-line pt-4">
          <a
            href={feedbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-11 items-center gap-2.5 rounded-[var(--radius-input)] text-sm text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            <MessageSquare className="size-4 shrink-0 text-accent" aria-hidden />
            <span>
              <span className="font-medium text-ink">How was the workshop?</span>{" "}
              Two minutes of feedback helps us run the next one better.
            </span>
            <ExternalLink
              className="size-3.5 shrink-0 text-ink-faint transition-colors group-hover:text-ink-muted"
              aria-hidden
            />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
      ) : null}
    </Panel>
  )
}
