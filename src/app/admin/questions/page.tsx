import type { Metadata } from "next"
import { ListChecks } from "lucide-react"
import { getQuestions, getLockedQuestionIds, getQuizzes } from "@/lib/admin/queries"
import { PageHeader } from "@/components/admin/page-header"
import { DataSurface } from "@/components/ui/surface"
import { EmptyState, Alert } from "@/components/ui/states"
import { QuestionManager } from "@/components/admin/question-manager"
import { QUESTIONS_PER_QUIZ } from "@/lib/constants"

export const metadata: Metadata = { title: "Questions" }
export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function QuestionsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const quizSlug = (Array.isArray(sp["quiz"]) ? sp["quiz"][0] : sp["quiz"]) ?? ""

  const quizzes = await getQuizzes()
  const selected = quizzes.find((q) => q.slug === quizSlug)

  const [questions, locked, all] = await Promise.all([
    getQuestions(selected?.id),
    getLockedQuestionIds(),
    getQuestions(),
  ])

  const counts = Object.fromEntries(
    quizzes.map((z) => [z.slug, all.filter((q) => q.quiz_id === z.id && q.is_active).length]),
  ) as Record<string, number>

  const unbalanced = quizzes.filter((z) => counts[z.slug] !== QUESTIONS_PER_QUIZ)

  return (
    <>
      <PageHeader
        title="Questions"
        description={quizzes.map((z) => `${z.title.replace(" Quiz", "")} ${counts[z.slug]}`).join(" · ")}
      />

      {unbalanced.length > 0 && (
        <div className="mb-4">
          <Alert tone="warn">
            Each quiz should have {QUESTIONS_PER_QUIZ} active questions. Currently{" "}
            {unbalanced.map((z) => `${z.title} has ${counts[z.slug]}`).join(", ")}. Students would
            be scored out of a different total until this is corrected.
          </Alert>
        </div>
      )}

      {locked.size > 0 && (
        <div className="mb-4">
          <Alert tone="info">
            {locked.size} question{locked.size > 1 ? "s have" : " has"} already been graded. Their
            wording, options and answer key are locked so completed results stay meaningful — you
            can still disable them or edit the explanation.
          </Alert>
        </div>
      )}

      {questions.length === 0 ? (
        <DataSurface>
          <EmptyState
            icon={ListChecks}
            title="No questions in this view"
            description="Run supabase/seed.sql to load the 40 workshop questions, or add one below."
          />
        </DataSurface>
      ) : (
        <QuestionManager
          questions={questions}
          quizzes={quizzes}
          lockedIds={[...locked]}
          activeQuiz={quizSlug}
        />
      )}
    </>
  )
}
