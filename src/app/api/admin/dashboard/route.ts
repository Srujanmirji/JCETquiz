import { requireAdminApi } from "@/lib/auth/guards"
import { getDashboardMetrics } from "@/lib/admin/queries"
import { ok, fail } from "@/lib/api"

export const dynamic = "force-dynamic"

/** GET /api/admin/dashboard — metrics (docs/API.md). */
export async function GET() {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  try {
    return ok(await getDashboardMetrics())
  } catch (err) {
    console.error("[admin] dashboard failed", err)
    return fail("server_error", "Could not load metrics.")
  }
}
