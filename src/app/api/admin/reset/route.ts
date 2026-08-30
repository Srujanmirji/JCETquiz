import { NextRequest } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { resetAttempt } from "@/lib/quiz/service"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { resetAttemptSchema } from "@/lib/validation"
import type { QuizSlug } from "@/lib/constants"

/**
 * POST /api/admin/reset — clear one student's attempt at one quiz.
 *
 * The event-day escape hatch: wrong Google account, dead browser mid-quiz.
 * Without it, one-attempt-per-quiz is a trap rather than a rule.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdminApi()
  if (!admin) return fail("forbidden", "Admin access required.")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("invalid_input", "Invalid request body.")
  }

  const parsed = resetAttemptSchema.safeParse(body)
  if (!parsed.success) return fail("invalid_input", "Unknown student or quiz.")

  try {
    await resetAttempt(parsed.data.profileId, parsed.data.slug as QuizSlug)
    console.warn("[admin] attempt reset", {
      by: admin.id, profile: parsed.data.profileId, quiz: parsed.data.slug,
    })
    return ok({ reset: true })
  } catch (err) {
    return failFromPostgres(err)
  }
}
