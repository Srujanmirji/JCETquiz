import { NextRequest } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { questionSchema, fieldErrors } from "@/lib/validation"

/** POST /api/admin/questions — add a question. */
export async function POST(request: NextRequest) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("invalid_input", "Invalid request body.")
  }

  const parsed = questionSchema.safeParse(body)
  if (!parsed.success) {
    return fail("invalid_input", "Please check the highlighted fields.", fieldErrors(parsed.error))
  }

  const admin = createAdminClient()

  const { data: last } = await admin
    .from("quiz_questions")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data, error } = await admin
    .from("quiz_questions")
    .insert({ ...parsed.data, position: ((last?.position as number | undefined) ?? 0) + 1 })
    .select()
    .single()

  if (error) return failFromPostgres(error)
  return ok(data)
}
