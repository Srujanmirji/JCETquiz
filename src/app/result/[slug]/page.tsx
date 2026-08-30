import type { Metadata } from "next"
import { Suspense } from "react"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowRight, Check } from "lucide-react"
import { requireUser, getProfile } from "@/lib/auth/guards"
import { getStudentProgress } from "@/lib/quiz/service"
import { isQuizSlug } from "@/lib/constants"
import { StudentShell } from "@/components/marketing/shell"
import { Panel, Card } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import { ScoreDisplay } from "@/components/result/score-display"
import { SignOutButton } from "@/components/marketing/sign-out-button"
import { AnswerReviewSection } from "@/components/result/answer-review-section"
import { AnswerReviewLoading } from "@/components/result/answer-review"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: isQuizSlug(slug) ? `${slug.toUpperCase()} Result` : "Result" }
}

/** The per-quiz result a student sees immediately after submitting. */
export default async function QuizResultPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!isQuizSlug(slug)) notFound()

  const user = await requireUser()
  const profile = await getProfile(user.id)
  if (!profile) redirect("/register")

  const progress = await getStudentProgress(profile.id)
  const quiz = progress.quizzes.find((q) => q.slug === slug)
  if (!quiz) notFound()
  if (quiz.state !== "completed" || quiz.score === null) redirect("/dashboard")

  const nextUp = progress.quizzes.find((q) => q.state === "available")

  return (
    <StudentShell width="narrow" meta={<SignOutButton />}>
      <div className="space-y-7">
        <header className="space-y-1.5 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            {quiz.title} complete
          </p>
          <h1 className="sr-only">Your {quiz.title} result</h1>
        </header>

        <Panel className="bloom px-6 py-10 sm:px-10 sm:py-12">
          <ScoreDisplay
            score={quiz.score}
            total={quiz.questionCount}
            percentage={Number(quiz.percentage)}
            tone={Number(quiz.percentage) >= 70 ? "ok" : "accent"}
            caption={`${quiz.title} · ${quiz.subtitle}`}
          />
        </Panel>

        {/* What happens next — never leave a student at a dead end. */}
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-input)] border border-ok/35 bg-ok/12">
                <Check className="size-4 text-ok" strokeWidth={3} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-medium text-ink">Result saved</p>
                <p className="mt-0.5 max-w-[46ch] text-xs leading-relaxed text-ink-muted">
                  {nextUp
                    ? `${nextUp.title} is open now.`
                    : progress.workshopComplete
                      ? "All sessions have finished — your final result is ready."
                      : "Wait for the instructor to open the next session."}
                </p>
              </div>
            </div>

            <Button asChild>
              <Link href={nextUp ? `/quiz/${nextUp.slug}` : progress.workshopComplete ? "/result" : "/dashboard"}>
                {nextUp ? `Continue to ${nextUp.subtitle}` : progress.workshopComplete ? "Final result" : "Back to dashboard"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </Card>

        {/* Running progress, so the student always knows where they are. */}
        <ol className="grid grid-cols-4 gap-2">
          {progress.quizzes.map((q) => (
            <li key={q.slug}>
              <div
                className={`rounded-[var(--radius-chip)] border px-2 py-2.5 text-center ${
                  q.state === "completed"
                    ? "border-ok/35 bg-ok/10"
                    : q.state === "available"
                      ? "border-accent/40 bg-accent/10"
                      : "border-line bg-glass"
                }`}
              >
                <p className="truncate text-2xs font-medium uppercase tracking-wide text-ink-muted">
                  {q.subtitle}
                </p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-ink">
                  {q.state === "completed" ? `${q.score}/${q.questionCount}` : "—"}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <Suspense fallback={<AnswerReviewLoading />}>
          <AnswerReviewSection profileId={user.id} slug={slug} />
        </Suspense>
      </div>
    </StudentShell>
  )
}
