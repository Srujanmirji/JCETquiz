"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Clears one student's attempt at one quiz.
 *
 * One attempt per quiz is enforced in the database, which is correct — but on
 * event day someone signs in with the wrong Google account or their browser
 * dies mid-quiz. Without this, that rule is a trap. Deliberately two clicks.
 */
export function ResetAttempt({
  profileId,
  slug,
  quizTitle,
}: {
  profileId: string
  slug: string
  quizTitle: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function reset() {
    setBusy(true)
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, slug }),
      })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        title={`Let this student retake ${quizTitle}`}
        aria-label={`Reset ${quizTitle} attempt`}
      >
        <RotateCcw className="size-4" aria-hidden />
      </Button>
    )
  }

  return (
    <span className="flex items-center gap-1.5">
      <Button variant="danger" size="sm" onClick={reset} disabled={busy}>
        {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
        Confirm reset
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
        Cancel
      </Button>
    </span>
  )
}
