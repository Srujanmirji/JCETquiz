"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, Send, RefreshCw, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CertificateStatus } from "@/types/database"

export function CertificateActions({
  certificateId,
  status,
  eligible,
  studentName,
  compact = false,
}: {
  certificateId: string | null
  status: CertificateStatus | null
  eligible: boolean
  studentName: string
  compact?: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<null | "send" | "resend">(null)
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null)

  if (!eligible || !certificateId) {
    return <span className="text-xs text-ink-faint">Not eligible</span>
  }

  const sent = status === "sent"
  const sending = status === "sending"

  async function send(isResend: boolean) {
    setBusy(isResend ? "resend" : "send")
    setMessage(null)

    try {
      const res = await fetch(
        `/api/admin/certificates/${certificateId}/send${isResend ? "?resend=1" : ""}`,
        { method: "POST" },
      )
      const json = await res.json()

      if (res.ok) {
        setMessage({ tone: "ok", text: `Sent to ${json.data?.email ?? studentName}` })
        router.refresh()
      } else {
        setMessage({ tone: "bad", text: json?.error?.message ?? "Send failed." })
      }
    } catch {
      setMessage({ tone: "bad", text: "Network error. Please try again." })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className={compact ? "flex flex-col items-end gap-1.5" : "space-y-2"}>
      <div className="flex flex-wrap items-center gap-1.5">
        <Button asChild variant="ghost" size="sm" className="size-8 p-0" title="Preview Certificate">
          <a
            href={`/api/admin/certificates/${certificateId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Eye className="size-4 text-ink-muted hover:text-ink" aria-hidden />
            <span className="sr-only">Preview</span>
          </a>
        </Button>

        {sending ? (
          <Button size="sm" disabled className="size-8 p-0">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span className="sr-only">Sending…</span>
          </Button>
        ) : sent ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => send(true)}
            disabled={busy !== null}
            className="size-8 p-0"
            title="Resend Certificate"
          >
            {busy === "resend" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-3.5 text-ink-muted hover:text-ink" aria-hidden />
            )}
            <span className="sr-only">Resend</span>
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => send(false)}
            disabled={busy !== null}
            className="size-8 p-0 bg-accent hover:bg-accent-soft text-on-accent"
            title="Send Certificate"
          >
            {busy === "send" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-3.5" aria-hidden />
            )}
            <span className="sr-only">Send</span>
          </Button>
        )}
      </div>

      {message && (
        <p
          role="status"
          className={`max-w-[36ch] text-right text-xs ${message.tone === "ok" ? "text-ok" : "text-bad"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
