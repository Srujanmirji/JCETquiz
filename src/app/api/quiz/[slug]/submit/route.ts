import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { submitQuiz } from "@/lib/quiz/service"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { submitSchema } from "@/lib/validation"
import { isQuizSlug } from "@/lib/constants"
import type { QuizResult } from "@/types/database"

/**
 * POST /api/quiz/:slug/submit
 *
 * The client sends only {questionId, selectedOption} pairs — never a score.
 * `submit_quiz` takes a row lock, refuses a second submission, rejects any
 * question that does not belong to THIS quiz, grades against the server-side
 * key, and recomputes the running final result in the same transaction.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail("unauthenticated", "Please sign in to continue.")

  const { slug } = await params
  if (!isQuizSlug(slug)) return fail("not_found", "Unknown quiz.")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("invalid_input", "Invalid request body.")
  }

  const parsed = submitSchema.safeParse(body)
  if (!parsed.success) {
    return fail("invalid_input", "The submission was not valid. Please reload and try again.")
  }

  try {
    const attempt = await submitQuiz(user.id, slug, parsed.data.answers)
    const result: QuizResult = {
      slug,
      score: attempt.score ?? 0,
      totalQuestions: attempt.total_questions ?? 0,
      percentage: Number(attempt.percentage ?? 0),
    }
    return ok(result)
  } catch (err) {
    return failFromPostgres(err)
  }
}
