"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select } from "@/components/ui/field"

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  return (
    <div className="w-full sm:w-56">
      <label htmlFor="sort" className="sr-only">
        Sort results
      </label>
      <Select
        id="sort"
        value={params.get("sort") ?? "score_desc"}
        onChange={(e) => {
          const q = new URLSearchParams(params.toString())
          q.set("sort", e.target.value)
          q.delete("page")
          router.replace(`${pathname}?${q.toString()}`, { scroll: false })
        }}
      >
        <option value="score_desc">Highest score</option>
        <option value="score_asc">Lowest score</option>
        <option value="recent">Most recent</option>
        <option value="name">Name (A–Z)</option>
      </Select>
    </div>
  )
}
