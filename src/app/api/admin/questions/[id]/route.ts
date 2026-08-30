import { NextRequest } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { questionSchema, fieldErrors } from "@/lib/validation"

/**
 * PATCH /api/admin/questions/:id
 *
 * ADMIN.md: a question that has already been graded must not change meaning.
 * Once any answer references it, only `is_active` and `explanation` are
 * accepted here — and the database enforces the same rule independently via
 * the protect_answered_questions trigger.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  const { id } = await params
  const admin = createAdminClient()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("invalid_input", "Invalid request body.")
  }

  const { count } = await admin
    .from("quiz_answers")
    .select("id", { count: "exact", head: true })
    .eq("question_id", id)

  const locked = (count ?? 0) > 0

  if (locked) {
    const partial = body as { is_active?: boolean; explanation?: string | null }
    const update: Record<string, unknown> = {}
    if (typeof partial.is_active === "boolean") update["is_active"] = partial.is_active
    if (partial.explanation !== undefined) update["explanation"] = partial.explanation

    if (Object.keys(update).length === 0) {
      return fail(
        "conflict",
        "This question has already been answered in a graded attempt. Only its active state and explanation can change.",
      )
    }

    const { data, error } = await admin
      .from("quiz_questions")
      .update(update)
      .eq("id", id)
      .select()
      .single()

    if (error) return failFromPostgres(error)
    return ok(data)
  }

  const parsed = questionSchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail("invalid_input", "Please check the highlighted fields.", fieldErrors(parsed.error))
  }

  const { data, error } = await admin
    .from("quiz_questions")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single()

  if (error) return failFromPostgres(error)
  return ok(data)
}

/** DELETE — refused for graded questions; disable them instead. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  const { id } = await params
  const { error } = await createAdminClient().from("quiz_questions").delete().eq("id", id)

  if (error) return failFromPostgres(error)
  return ok({ deleted: true })
}
