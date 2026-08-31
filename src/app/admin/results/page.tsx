import { Suspense } from "react"
import type { Metadata } from "next"
import { getParticipants, getBranches, type ParticipantFilters as Filters } from "@/lib/admin/queries"
import { PageHeader } from "@/components/admin/page-header"
import { ParticipantFilters } from "@/components/admin/participant-filters"
import { ParticipantTable } from "@/components/admin/participant-table"
import { Pagination } from "@/components/admin/pagination"
import { SortSelect } from "@/components/admin/sort-select"
import { ExportButton } from "@/components/admin/export-button"
import { Skeleton } from "@/components/ui/states"

export const metadata: Metadata = { title: "Quiz Results" }
export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Same data as /admin/participants, seen through the results lens. */
export default async function ResultsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const filters: Filters = {
    search: one(sp["search"]) ?? "",
    branch: one(sp["branch"]) ?? "",
    status: "completed",
    eligibility: (one(sp["eligibility"]) as Filters["eligibility"]) ?? "all",
    sort: (one(sp["sort"]) as Filters["sort"]) ?? "score_desc",
    page: Number(one(sp["page"]) ?? 1) || 1,
    pageSize: 25,
  }

  const [{ rows, total, page, pageSize }, branches] = await Promise.all([
    getParticipants(filters),
    getBranches(),
  ])

  return (
    <>
      <PageHeader
        title="Quiz Results"
        description="Students who have finished all four quizzes, highest total first."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <ExportButton label="Export results" />
            <SortSelect />
          </div>
        }
      />
      <Suspense fallback={<Skeleton className="mb-4 h-11 w-full" />}>
        <ParticipantFilters branches={branches} showStatus={false} />
      </Suspense>
      <ParticipantTable rows={rows} />
      <Pagination page={page} pageSize={pageSize} total={total} />
    </>
  )
}
