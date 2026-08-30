import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { requireUser, getProfile } from "@/lib/auth/guards"
import { getQuestions, getQuiz, getSettings, startQuizAttempt } from "@/lib/quiz/service"
import { isQuizSlug } from "@/lib/constants"
import { QuizRunner } from "@/components/quiz/quiz-runner"
import { QuizClosed } from "@/components/quiz/quiz-closed"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  return { title: isQuizSlug(slug) ? `${slug.toUpperCase()} Quiz` : "Quiz" }
}

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!isQuizSlug(slug)) notFound()

  const user = await requireUser()
  const profile = await getProfile(user.id)
  if (!profile) redirect("/register")

  const quiz = await getQuiz(slug)
  if (!quiz) notFound()

  const settings = await getSettings()

  // Server-side gate, re-run on every render. A student typing the URL, opening
  // a second tab, or restoring a cached page still hits this.
  try {
    await startQuizAttempt(user.id, slug)
  } catch (err) {
    const code = (err as { code?: string }).code
    // Already completed → their result. Session not open → the holding screen.
    if (code === "P0001") redirect(`/result/${slug}`)
    if (code === "P0002") {
      return (
        <QuizClosed
          quizTitle={quiz.title}
          sessionState={quiz.session_state}
          workshopName={settings?.workshop_name ?? "Web Development Workshop"}
        />
      )
    }
    throw err
  }

  const questions = await getQuestions(slug)

  return (
    <QuizRunner
      slug={slug}
      quizTitle={quiz.title}
      quizSubtitle={quiz.subtitle}
      questions={questions}
      studentName={profile.name}
      workshopName={settings?.workshop_name ?? "Web Development Workshop"}
    />
  )
}
