import { createClient } from "@/lib/supabase/server"
import { getQuestions } from "@/lib/quiz/service"
import { ok, fail } from "@/lib/api"
import { isQuizSlug } from "@/lib/constants"

export const dynamic = "force-dynamic"

/**
 * GET /api/quiz/:slug — that quiz's active questions, WITHOUT the answer key.
 * Reads public_questions, whose projection has no correct_option column.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail("unauthenticated", "Please sign in to continue.")

  const { slug } = await params
  if (!isQuizSlug(slug)) return fail("not_found", "Unknown quiz.")

  try {
    const questions = await getQuestions(slug)
    return ok({ slug, questions, total: questions.length })
  } catch (err) {
    console.error("[quiz] fetch failed", err)
    return fail("server_error", "Could not load the questions. Please refresh.")
  }
}
