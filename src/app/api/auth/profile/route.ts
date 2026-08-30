import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ok, fail, failFromPostgres } from "@/lib/api"
import { profileSchema, fieldErrors } from "@/lib/validation"

/**
 * POST /api/auth/profile — create or update the participant profile.
 *
 * Identity comes from the verified session, never from the request body:
 *  - `id`    is the Supabase auth user id
 *  - `email` is the Google-verified address
 * Both are ignored if a client sends them, and the database blocks changes to
 * either after insert (see 0002_rls.sql, freeze_profile_identity).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return fail("unauthenticated", "Please sign in to continue.")

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail("invalid_input", "Invalid request body.")
  }

  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return fail("invalid_input", "Please check the highlighted fields.", fieldErrors(parsed.error))
  }

  const admin = createAdminClient()

  // Year can be pinned by event rules (docs/PRD.md §3).
  const { data: settings } = await admin
    .from("workshop_settings")
    .select("lock_year")
    .maybeSingle()

  const year = settings?.lock_year ? "1st Year" : parsed.data.year

  const { data, error } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        name: parsed.data.name,
        phone: parsed.data.phone,
        branch: parsed.data.branch,
        year,
      },
      { onConflict: "id" },
    )
    .select()
    .single()

  if (error) return failFromPostgres(error)

  return ok(data)
}
