import { Suspense } from "react"
import type { Metadata } from "next"
import { getParticipants, getBranches, type ParticipantFilters as Filters } from "@/lib/admin/queries"
import { PageHeader } from "@/components/admin/page-header"
import { ParticipantFilters } from "@/components/admin/participant-filters"
import { ParticipantTable } from "@/components/admin/participant-table"
import { Pagination } from "@/components/admin/pagination"
import { Skeleton } from "@/components/ui/states"

export const metadata: Metadata = { title: "Participants" }
export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

export default async function ParticipantsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams

  const filters: Filters = {
    search: one(sp["search"]) ?? "",
    branch: one(sp["branch"]) ?? "",
    status: (one(sp["status"]) as Filters["status"]) ?? "all",
    eligibility: (one(sp["eligibility"]) as Filters["eligibility"]) ?? "all",
    sort: (one(sp["sort"]) as Filters["sort"]) ?? "recent",
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
        title="Participants"
        description={`${total} registered ${total === 1 ? "student" : "students"}.`}
      />

      <Suspense fallback={<Skeleton className="mb-4 h-11 w-full" />}>
        <ParticipantFilters branches={branches} />
      </Suspense>

      <ParticipantTable rows={rows} />
      <Pagination page={page} pageSize={pageSize} total={total} />
    </>
  )
}
