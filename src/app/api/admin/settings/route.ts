import { NextRequest } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { settingsSchema, fieldErrors } from "@/lib/validation"

/** PATCH /api/admin/settings — workshop configuration. */
export async function PATCH(request: NextRequest) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("invalid_input", "Invalid request body.")
  }

  const parsed = settingsSchema.partial().safeParse(body)
  if (!parsed.success) {
    return fail("invalid_input", "Please check the highlighted fields.", fieldErrors(parsed.error))
  }

  const { data, error } = await createAdminClient()
    .from("workshop_settings")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select()
    .single()

  if (error) return failFromPostgres(error)
  return ok(data)
}
