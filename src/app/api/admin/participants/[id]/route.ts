import { requireAdminApi } from "@/lib/auth/guards"
import { getParticipant } from "@/lib/admin/queries"
import { ok, fail } from "@/lib/api"

export const dynamic = "force-dynamic"

/** GET /api/admin/participants/:id — profile, attempt, certificate (docs/API.md). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  const { id } = await params
  const row = await getParticipant(id)
  if (!row) return fail("not_found", "Participant not found.")

  return ok(row)
}
