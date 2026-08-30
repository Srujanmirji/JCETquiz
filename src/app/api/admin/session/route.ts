import { NextRequest } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { openSession, closeSession, forceCloseSession } from "@/lib/quiz/service"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { sessionActionSchema } from "@/lib/validation"
import type { QuizSlug } from "@/lib/constants"

/**
 * POST /api/admin/session — the instructor's session control.
 *
 *   open        start this session (auto-closes whatever was open)
 *   close       stop NEW attempts; anyone mid-quiz may still finish
 *   force_close auto-submit stragglers, then close
 */
export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("invalid_input", "Invalid request body.")
  }

  const parsed = sessionActionSchema.safeParse(body)
  if (!parsed.success) return fail("invalid_input", "Unknown quiz or action.")

  const slug = parsed.data.slug as QuizSlug

  try {
    if (parsed.data.action === "open") return ok(await openSession(slug))
    if (parsed.data.action === "close") return ok(await closeSession(slug))
    const submitted = await forceCloseSession(slug)
    return ok({ slug, forceSubmitted: submitted })
  } catch (err) {
    return failFromPostgres(err)
  }
}
