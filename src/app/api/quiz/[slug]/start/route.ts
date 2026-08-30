import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { startQuizAttempt } from "@/lib/quiz/service"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { isQuizSlug } from "@/lib/constants"

/**
 * POST /api/quiz/:slug/start
 *
 * Idempotent. `start_quiz_attempt` refuses unless the instructor has that
 * session open, and the UNIQUE(profile_id, quiz_id) constraint is what actually
 * enforces one attempt per quiz.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail("unauthenticated", "Please sign in to continue.")

  const { slug } = await params
  if (!isQuizSlug(slug)) return fail("not_found", "Unknown quiz.")

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles").select("id").eq("id", user.id).maybeSingle()
  if (!profile) return fail("no_profile", "Please complete your registration first.")

  try {
    return ok(await startQuizAttempt(user.id, slug))
  } catch (err) {
    return failFromPostgres(err)
  }
}
