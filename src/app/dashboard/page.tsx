import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Award, ArrowRight } from "lucide-react"
import { requireUser, getProfile } from "@/lib/auth/guards"
import { getStudentProgress } from "@/lib/quiz/service"
import { StudentShell } from "@/components/marketing/shell"
import { Panel, Card } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import { QuizCard } from "@/components/dashboard/quiz-card"
import { CompletionCard } from "@/components/dashboard/completion-card"
import { SignOutButton } from "@/components/marketing/sign-out-button"
import { PASS_SCORE, TOTAL_QUESTIONS } from "@/lib/constants"

export const metadata: Metadata = { title: "Dashboard" }
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const user = await requireUser()
  const profile = await getProfile(user.id)
  if (!profile) redirect("/register")

  const progress = await getStudentProgress(profile.id)
  const done = progress.quizzes.filter((q) => q.state === "completed").length
  // A student who has finished all four gets their verdict now. Waiting for the
  // instructor to close the last session would be pointless for them — that
  // gate exists so people who MISSED a session still get a result at the end.
  const allDone = done === progress.quizzes.length
  const canSeeFinal = allDone || progress.workshopComplete
  const available = progress.quizzes.find((q) => q.state === "available")
  const firstName = profile.name.split(" ")[0]

  return (
    <StudentShell width="wide" meta={<SignOutButton />}>
      <div className="mx-auto w-full max-w-3xl space-y-7">
        <header className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            Welcome back
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
            {firstName}
          </h1>
          <p className="text-sm text-ink-muted">
            {allDone
              ? "You have finished every quiz."
              : available
                ? `${available.title} is open now.`
                : progress.workshopComplete
                  ? "All sessions are finished."
                  : "Waiting for the next session to begin."}
          </p>
        </header>

        {/* ---- overall progress ---- */}
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-faint">Overall progress</p>
              <p className="mt-1.5 font-mono text-3xl font-bold tabular-nums tracking-[-0.03em] text-ink">
                {done}
                <span className="text-xl text-ink-faint">/{progress.quizzes.length}</span>
                <span className="ml-2.5 text-sm font-medium text-ink-muted">quizzes done</span>
              </p>
            </div>
            {progress.final && progress.final.total_score > 0 && (
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-ink-faint">Score so far</p>
                <p className="mt-1.5 font-mono text-3xl font-bold tabular-nums tracking-[-0.03em] text-ink">
                  {progress.final.total_score}
                  <span className="text-xl text-ink-faint">/{TOTAL_QUESTIONS}</span>
                </p>
              </div>
            )}
          </div>

          <div
            className="mt-4 flex gap-1.5"
            role="img"
            aria-label={`${done} of ${progress.quizzes.length} quizzes completed`}
          >
            {progress.quizzes.map((q) => (
              <div
                key={q.slug}
                className={`h-1.5 flex-1 rounded-full ${
                  q.state === "completed"
                    ? "bg-ok"
                    : q.state === "available"
                      ? "bg-accent"
                      : "bg-[rgba(255,255,255,0.08)]"
                }`}
              />
            ))}
          </div>
        </Panel>

        {/* ---- the four stages ---- */}
        <section aria-labelledby="stages" className="space-y-2.5">
          <h2 id="stages" className="text-sm font-medium text-ink-muted">
            Workshop stages
          </h2>
          {progress.quizzes.map((q) => (
            <QuizCard key={q.slug} quiz={q} />
          ))}
        </section>

        {/* ---- final result ---- */}
        {canSeeFinal && progress.final ? (
          <CompletionCard final={progress.final} email={profile.email} />
        ) : (
          <Card className="p-5">
            <p className="text-sm font-medium text-ink">Final result</p>
            <p className="mt-1 max-w-[56ch] text-xs leading-relaxed text-ink-muted">
              Unlocks once you have finished all four quizzes. You need{" "}
              <span className="text-ink">{PASS_SCORE} of {TOTAL_QUESTIONS}</span> overall for a
              certificate.
            </p>
          </Card>
        )}
      </div>
    </StudentShell>
  )
}
