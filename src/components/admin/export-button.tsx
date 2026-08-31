"use client"

import { useSearchParams } from "next/navigation"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Exports the CURRENT view, filters included — an organiser who has narrowed to
 * "eligible, CSE" expects the file to match what is on screen.
 *
 * A plain link rather than fetch(): the browser handles the download, so it
 * needs no JavaScript and cannot leave the page in a half-loading state.
 */
export function ExportButton({ label = "Export CSV" }: { label?: string }) {
  const params = useSearchParams()

  const query = new URLSearchParams()
  for (const key of ["search", "branch", "status", "eligibility", "sort"]) {
    const v = params.get(key)
    if (v) query.set(key, v)
  }
  const href = `/api/admin/export${query.toString() ? `?${query}` : ""}`

  return (
    <Button asChild variant="secondary" size="sm">
      <a href={href} download>
        <Download className="size-4" aria-hidden />
        {label}
      </a>
    </Button>
  )
}
