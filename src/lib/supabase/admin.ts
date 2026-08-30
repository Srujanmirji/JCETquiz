import "server-only"

import { createClient } from "@supabase/supabase-js"
import { publicEnv } from "@/lib/env"
import { serverEnv } from "@/lib/env"

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * Only for operations the database itself must arbitrate: creating an attempt,
 * grading a submission, writing certificate audit rows. Every caller must have
 * already established WHO is asking via `requireStudent`/`requireAdmin`.
 *
 * The `server-only` import above makes importing this from a client component
 * a build failure.
 */
export function createAdminClient() {
  return createClient(publicEnv.supabaseUrl, serverEnv().serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
