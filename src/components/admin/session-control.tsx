"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Play, Square, ZapOff } from "lucide-react"
import type { Quiz, QuizStat } from "@/types/database"
import { DataSurface } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/states"
import { cn } from "@/lib/utils"

/**
 * The instructor's control for event day.
 *
 * Ending a session blocks NEW attempts but lets anyone mid-quiz finish — the
 * in-progress count tells you when it is safe to move on. Force close exists
 * for when you have to move on anyway, and auto-submits the stragglers.
 */
export function SessionControl({
  quizzes,
  stats,
}: {
  quizzes: Quiz[]
  stats: QuizStat[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  async function act(slug: string, action: "open" | "close" | "force_close") {
    setBusy(`${slug}:${action}`)
    setError(null)
    setNote(null)
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error?.message ?? "Could not change the session.")
      } else {
        if (action === "force_close" && json.data?.forceSubmitted > 0) {
          setNote(`Auto-submitted ${json.data.forceSubmitted} in-progress attempt(s).`)
        }
        router.refresh()
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusy(null)
    }
  }

  return (
    <DataSurface className="p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-ink">Session control</h2>
          <p className="mt-1 text-xs text-ink-faint">
            Students can only take a quiz while its session is open. Opening one closes the others.
          </p>
        </div>
      </div>

      {error && <div className="mt-4"><Alert>{error}</Alert></div>}
      {note && <div className="mt-4"><Alert tone="info">{note}</Alert></div>}

      <ul className="mt-4 divide-y divide-line border-t border-line">
        {quizzes.map((q) => {
          const stat = stats.find((s) => s.slug === q.slug)
          const open = q.session_state === "open"
          const inProgress = stat?.inProgress ?? 0

          return (
            <li key={q.slug} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    open ? "bg-accent" : q.session_state === "closed" ? "bg-ok" : "bg-ink-faint/50",
                  )}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{q.title}</p>
                  <p className="text-xs text-ink-faint">
                    {stat?.completed ?? 0} completed
                    {inProgress > 0 && (
                      <span className="text-warn"> · {inProgress} in progress</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={open ? "orange" : q.session_state === "closed" ? "ok" : "neutral"}>
                  {open ? "Open" : q.session_state === "closed" ? "Ended" : "Not started"}
                </Badge>

                {open ? (
                  <>
                    <Button
                      variant="secondary" size="sm"
                      onClick={() => act(q.slug, "close")}
                      disabled={busy !== null}
                    >
                      {busy === `${q.slug}:close`
                        ? <Loader2 className="size-4 animate-spin" aria-hidden />
                        : <Square className="size-4" aria-hidden />}
                      End session
                    </Button>
                    {inProgress > 0 && (
                      <Button
                        variant="danger" size="sm"
                        onClick={() => act(q.slug, "force_close")}
                        disabled={busy !== null}
                        title={`Auto-submit ${inProgress} in-progress attempt(s) and close`}
                      >
                        {busy === `${q.slug}:force_close`
                          ? <Loader2 className="size-4 animate-spin" aria-hidden />
                          : <ZapOff className="size-4" aria-hidden />}
                        Force close
                      </Button>
                    )}
                  </>
                ) : (
                  <Button size="sm" onClick={() => act(q.slug, "open")} disabled={busy !== null}>
                    {busy === `${q.slug}:open`
                      ? <Loader2 className="size-4 animate-spin" aria-hidden />
                      : <Play className="size-4" aria-hidden />}
                    {q.session_state === "closed" ? "Reopen" : "Start session"}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </DataSurface>
  )
}
