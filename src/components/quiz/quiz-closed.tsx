import Link from "next/link"
import { Clock, Lock } from "lucide-react"
import type { SessionState } from "@/types/database"
import { StudentShell } from "@/components/marketing/shell"
import { Panel } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"

/** Shown when a student reaches a quiz whose session the instructor has not opened. */
export function QuizClosed({
  quizTitle,
  sessionState,
  workshopName,
}: {
  quizTitle: string
  sessionState: SessionState
  workshopName: string
}) {
  const ended = sessionState === "closed"

  return (
    <StudentShell width="narrow">
      <Panel className="p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-[var(--radius-input)] border border-line bg-glass">
          {ended ? (
            <Clock className="size-5 text-ink-muted" aria-hidden />
          ) : (
            <Lock className="size-5 text-ink-muted" aria-hidden />
          )}
        </div>

        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.01em] text-ink">
          {ended ? `The ${quizTitle} session has ended` : `${quizTitle} has not started yet`}
        </h1>

        <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
          {ended
            ? "That session is closed. You can still take the remaining quizzes and qualify for a certificate."
            : `Your place in ${workshopName} is saved. The instructor opens each quiz during its session — come back to your dashboard then.`}
        </p>

        <Button asChild variant="secondary" className="mt-6">
          <Link href="/dashboard">Back to my dashboard</Link>
        </Button>
      </Panel>
    </StudentShell>
  )
}
