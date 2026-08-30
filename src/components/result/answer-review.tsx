import type { AnswerReview, ReviewedQuestion } from "@/types/database"
import type { QuizSlug } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, DataSurface } from "@/components/ui/surface"
import { Skeleton } from "@/components/ui/states"

const LOCKED_MESSAGES = {
  session_open: "Answers unlock after your instructor closes this session and everyone has finished submitting.",
  awaiting_submissions: "The session is closed. Answers will unlock once the remaining students finish submitting or the instructor force-closes their attempts.",
  not_completed: "Answer review is available only for a submitted quiz. Return to your dashboard to check your attempt.",
} as const

export function AnswerReviewContent({ review, slug }: { review: AnswerReview | null; slug: QuizSlug }) {
  const ready = review?.state === "available"

  return (
    <section id="answer-review" aria-labelledby="answer-review-title" className="scroll-mt-24 space-y-4">
      <h2 id="answer-review-title" className="text-2xl font-semibold tracking-tight text-ink">Answer review</h2>

      {!ready ? (
        <Card className="space-y-4 p-5">
          <p role={review ? undefined : "alert"} className="text-base leading-relaxed text-ink-muted">
            {review ? LOCKED_MESSAGES[review.state] : "We couldn’t load your answer review. Your score is saved. Please try again."}
          </p>
          <Button asChild variant="secondary">
            {/* Full navigation rechecks the server gate instead of restoring a cached result. */}
            <a href={review?.state === "not_completed" ? "/dashboard" : `/result/${slug}#answer-review`}>
              {review?.state === "not_completed" ? "Back to dashboard" : review ? "Check availability" : "Try again"}
            </a>
          </Button>
        </Card>
      ) : review.questions.length === 0 ? (
        <Card className="space-y-4 p-5">
          <p className="text-base leading-relaxed text-ink-muted">No saved answers are available for this attempt. Ask your workshop instructor for help.</p>
          <Button asChild variant="secondary"><a href="/dashboard">Back to dashboard</a></Button>
        </Card>
      ) : (
        <>
          <p className="text-base leading-relaxed text-ink-muted">Compare your answers with the correct ones. Open a question to read its explanation.</p>
          <ol className="space-y-3">
            {review.questions.map((question, index) => (
              <li key={question.id}>
                <ReviewQuestion question={question} number={index + 1} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}

function ReviewQuestion({ question, number }: { question: ReviewedQuestion; number: number }) {
  const status = question.selected_option === null ? "Unanswered" : question.is_correct ? "Correct" : "Incorrect"

  return (
    <DataSurface>
      <details>
        <summary className="min-h-11 cursor-pointer rounded-[var(--radius-card)] p-5 text-base text-ink hover:bg-glass">
          <span className="font-medium break-words">{number}. {question.question_text}</span>
          <Badge tone={question.is_correct ? "ok" : "neutral"} className="ml-2 align-middle">{status}</Badge>
        </summary>
        <div className="space-y-5 border-t border-line p-5">
          <dl className="space-y-4 text-base leading-relaxed">
            <div>
              <dt className="text-sm text-ink-muted">Your answer</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words text-ink">
                {question.selected_option === null ? "Not answered" : question.options[question.selected_option]}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-muted">Correct answer</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words font-medium text-ink">{question.options[question.correct_option]}</dd>
            </div>
          </dl>
          <div className="border-t border-line pt-4">
            <h3 className="text-sm font-medium text-ink">Explanation</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-base leading-relaxed text-ink-muted">
              {question.explanation?.trim() || "An explanation hasn’t been added yet. Ask your instructor to walk through this answer."}
            </p>
          </div>
        </div>
      </details>
    </DataSurface>
  )
}

export function AnswerReviewLoading() {
  return (
    <section aria-label="Loading answer review" aria-busy="true" className="space-y-4">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </section>
  )
}
