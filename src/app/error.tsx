"use client"

import { useEffect } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/surface"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app]", error)
  }, [error])

  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <Panel className="w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold tracking-[-0.01em] text-ink">Something went wrong</h1>
        <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-ink-muted">
          The page could not load. Your quiz answers are saved on this device — try again, and if
          it keeps happening, tell one of the organisers.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-2xs text-ink-faint">Reference: {error.digest}</p>
        )}
        <Button onClick={reset} className="mt-6">
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      </Panel>
    </div>
  )
}
