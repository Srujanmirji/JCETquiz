import { NextRequest } from "next/server"
import { requireAdminApi } from "@/lib/auth/guards"
import { getParticipants, type ParticipantFilters } from "@/lib/admin/queries"
import { fail } from "@/lib/api"
import { toCsv, exportFilename } from "@/lib/admin/csv"
import { QUIZZES, TOTAL_QUESTIONS } from "@/lib/constants"
import { formatDateTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/export — every participant and their scores, as CSV.
 *
 * Honours the same filters as the participants screen, so "export what I am
 * looking at" does what an organiser expects. Deliberately unpaginated: the
 * point is the whole cohort in one file.
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  const sp = new URL(request.url).searchParams
  const filters: ParticipantFilters = {
    search: sp.get("search") ?? "",
    branch: sp.get("branch") ?? "",
    status: (sp.get("status") as ParticipantFilters["status"]) ?? "all",
    eligibility: (sp.get("eligibility") as ParticipantFilters["eligibility"]) ?? "all",
    sort: (sp.get("sort") as ParticipantFilters["sort"]) ?? "score_desc",
    page: 1,
    pageSize: 5000,
  }

  try {
    const { rows } = await getParticipants(filters)

    const headers = [
      "Name", "Email", "Phone", "Branch", "Year",
      ...QUIZZES.map((q) => `${q.title.replace(" Quiz", "")} (/10)`),
      `Total (/${TOTAL_QUESTIONS})`, "Percentage", "Quizzes Completed",
      "Eligible", "Certificate Status", "Certificate ID", "Certificate Sent At",
      "Registered At",
    ]

    const body = rows.map((r) => [
      r.name, r.email, r.phone, r.branch, r.year,
      ...QUIZZES.map((q) => {
        const s = r.scores[q.slug]
        // Blank for never-attempted, "in progress" for started-but-unsubmitted:
        // a 0 would read as "sat it and scored nothing", which is a different
        // thing entirely and would be unfair in a record.
        if (!s) return ""
        return s.status === "completed" ? s.score : "in progress"
      }),
      r.final?.total_score ?? "",
      r.final ? `${Number(r.final.percentage)}%` : "",
      r.final?.quizzes_completed ?? 0,
      r.final ? (r.final.certificate_eligible ? "Yes" : "No") : "",
      r.certificate?.status ?? "",
      r.certificate?.certificate_number ?? "",
      r.certificate?.sent_at ? formatDateTime(r.certificate.sent_at) : "",
      formatDateTime(r.created_at),
    ])

    return new Response(toCsv(headers, body), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename("participants")}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const message = (err as Error)?.message ?? String(err)
    console.error("[admin] export failed", err)
    return fail("server_error", `Could not build the export: ${message}`)
  }
}
