"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataSurface } from "@/components/ui/surface"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[admin]", error)
  }, [error])

  return (
    <DataSurface className="p-8 text-center">
      <h1 className="text-lg font-semibold text-ink">This screen could not load</h1>
      <p className="mx-auto mt-2 max-w-[52ch] text-sm leading-relaxed text-ink-muted">
        Usually this means the database is unreachable or the migrations have not been applied yet.
        Check the server logs, then try again.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-2xs text-ink-faint">Reference: {error.digest}</p>
      )}
      <Button onClick={reset} variant="secondary" className="mt-6">
        <RefreshCw className="size-4" aria-hidden />
        Try again
      </Button>
    </DataSurface>
  )
}
