"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number
  pageSize: number
  total: number
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) return null

  function goTo(next: number) {
    const q = new URLSearchParams(params.toString())
    q.set("page", String(next))
    router.replace(`${pathname}?${q.toString()}`, { scroll: false })
  }

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  // Generate page numbers with ellipses
  const pageNumbers: (number | string)[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (page > 3) pageNumbers.push("...")
    
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) {
      if (!pageNumbers.includes(i)) pageNumbers.push(i)
    }

    if (page < totalPages - 2) pageNumbers.push("...")
    if (!pageNumbers.includes(totalPages)) pageNumbers.push(totalPages)
  }

  return (
    <nav className="mt-5 flex flex-wrap items-center justify-between gap-4" aria-label="Pagination">
      <p className="tnum text-xs text-ink-muted">
        Showing <span className="font-semibold text-ink">{first}–{last}</span> of <span className="font-semibold text-ink">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
          className="size-9 p-0"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === "...") {
              return (
                <span key={`ellipsis-${idx}`} className="px-2 text-xs text-ink-faint">
                  …
                </span>
              )
            }
            const isCurrent = p === page
            return (
              <button
                key={`page-${p}`}
                onClick={() => goTo(Number(p))}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "grid size-9 place-items-center rounded-[var(--radius-chip)] text-xs font-semibold transition-colors",
                  isCurrent
                    ? "bg-accent text-on-accent shadow-[0_2px_10px_-2px_rgba(245,79,27,0.5)]"
                    : "border border-line bg-[rgba(255,255,255,0.03)] text-ink-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {p}
              </button>
            )
          })}
        </div>

        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
          className="size-9 p-0"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </nav>
  )
}
