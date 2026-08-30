import { NextRequest } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { getParticipants, type ParticipantFilters } from "@/lib/admin/queries"
import { ok, fail } from "@/lib/api"

export const dynamic = "force-dynamic"

/** GET /api/admin/participants — paginated + filtered (docs/API.md). */
export async function GET(request: NextRequest) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  const sp = new URL(request.url).searchParams
  const filters: ParticipantFilters = {
    search: sp.get("search") ?? "",
    branch: sp.get("branch") ?? "",
    status: (sp.get("status") as ParticipantFilters["status"]) ?? "all",
    eligibility: (sp.get("eligibility") as ParticipantFilters["eligibility"]) ?? "all",
    sort: (sp.get("sort") as ParticipantFilters["sort"]) ?? "recent",
    page: Number(sp.get("page") ?? 1) || 1,
    pageSize: Math.min(Number(sp.get("pageSize") ?? 25) || 25, 100),
  }

  try {
    return ok(await getParticipants(filters))
  } catch (err) {
    console.error("[admin] participants failed", err)
    return fail("server_error", "Could not load participants.")
  }
}
