import { createClient } from "@/lib/supabase/server"
import { getStudentProgress } from "@/lib/quiz/service"
import { ok, fail } from "@/lib/api"

export const dynamic = "force-dynamic"

/** GET /api/progress — the caller's per-quiz progress and running final result. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fail("unauthenticated", "Please sign in to continue.")

  try {
    return ok(await getStudentProgress(user.id))
  } catch (err) {
    console.error("[progress] failed", err)
    return fail("server_error", "Could not load your progress.")
  }
}
