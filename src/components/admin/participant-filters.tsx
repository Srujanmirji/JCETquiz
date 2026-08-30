"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input, Select } from "@/components/ui/field"

/**
 * URL-backed filters, so a filtered view is shareable, survives a refresh, and
 * restores on Back — which matters when an organiser is jumping between a list
 * and a participant during the event.
 */
export function ParticipantFilters({
  branches,
  showStatus = true,
  showEligibility = true,
}: {
  branches: string[]
  showStatus?: boolean
  showEligibility?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(params.get("search") ?? "")

  const push = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(params.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "all") next.set(key, value)
        else next.delete(key)
      }
      next.delete("page")
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
    },
    [params, pathname, router],
  )

  // Debounce the text box so typing does not fire a query per keystroke.
  useEffect(() => {
    const current = params.get("search") ?? ""
    if (search === current) return
    const id = setTimeout(() => push({ search }), 300)
    return () => clearTimeout(id)
  }, [search, params, push])

  const hasFilters =
    Boolean(params.get("search")) ||
    Boolean(params.get("branch")) ||
    Boolean(params.get("status")) ||
    Boolean(params.get("eligibility"))

  return (
    <div className="mb-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
      <div className="relative">
        <label htmlFor="participant-search" className="sr-only">
          Search by name or email
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
          aria-hidden
        />
        <Input
          id="participant-search"
          type="search"
          placeholder="Search name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div>
        <label htmlFor="filter-branch" className="sr-only">
          Filter by branch
        </label>
        <Select
          id="filter-branch"
          value={params.get("branch") ?? ""}
          onChange={(e) => push({ branch: e.target.value })}
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </div>

      {showStatus && (
        <div>
          <label htmlFor="filter-status" className="sr-only">
            Filter by quiz status
          </label>
          <Select
            id="filter-status"
            value={params.get("status") ?? "all"}
            onChange={(e) => push({ status: e.target.value })}
          >
            <option value="all">Any status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In progress</option>
            <option value="not_started">Not started</option>
          </Select>
        </div>
      )}

      {showEligibility && (
        <div className="flex gap-2.5">
          <div className="flex-1">
            <label htmlFor="filter-eligibility" className="sr-only">
              Filter by certificate eligibility
            </label>
            <Select
              id="filter-eligibility"
              value={params.get("eligibility") ?? "all"}
              onChange={(e) => push({ eligibility: e.target.value })}
            >
              <option value="all">Any eligibility</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not eligible</option>
            </Select>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("")
                startTransition(() => router.replace(pathname, { scroll: false }))
              }}
              className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-input)] border border-line text-ink-muted transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              aria-label="Clear all filters"
              title="Clear filters"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
