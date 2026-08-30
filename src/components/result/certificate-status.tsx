import { Trophy, BookOpen, CheckCircle2, Clock, Mail } from "lucide-react"
import type { CertificateStatus as Status } from "@/types/database"
import { Card } from "@/components/ui/surface"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/utils"

/**
 * Result-page certificate state matching the mockup.
 */
export function CertificateStatusCard({
  eligible,
  status,
  sentAt,
  email,
}: {
  eligible: boolean
  status: Status | null
  sentAt: string | null
  email: string
}) {
  if (!eligible) {
    return (
      <Card className="border-line-strong p-5">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-input)] border border-line bg-[rgba(30,34,61,0.5)]">
            <BookOpen className="size-5 text-ink-muted" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-ink">Certificate Not Eligible</h2>
            <p className="max-w-[52ch] text-sm leading-relaxed text-ink-muted">
              Your attendance still counts — you took part in the full workshop. Keep the notes and
              the practice files; the concepts here are the same ones every web project starts from.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const sent = status === "sent"

  return (
    <Card className="relative overflow-hidden border-accent/40 bg-[rgba(30,34,61,0.6)] p-5 shadow-[0_8px_32px_-12px_rgba(245,79,27,0.35)]">
      <div className="relative z-10 flex items-start gap-4">
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-[var(--radius-input)] border ${
            sent ? "border-ok/40 bg-ok/15 text-ok" : "border-accent/50 bg-accent/15 text-accent"
          }`}
        >
          {sent ? (
            <CheckCircle2 className="size-5" aria-hidden />
          ) : (
            <Trophy className="size-5" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-accent">Certificate Eligible</h2>
            <Badge tone={sent ? "ok" : "orange"}>
              {sent ? (
                <>
                  <Mail className="size-3" aria-hidden /> Sent
                </>
              ) : (
                <>
                  <Clock className="size-3" aria-hidden /> Awaiting Delivery
                </>
              )}
            </Badge>
          </div>

          <p className="max-w-[58ch] text-sm leading-relaxed text-ink-muted">
            {sent ? (
              <>
                Sent to <span className="font-medium text-ink">{email}</span>
                {sentAt && <> on {formatDateTime(sentAt)}</>}. Check your spam folder if it has not
                arrived.
              </>
            ) : (
              <>
                You scored 70% or above. Your certificate will be sent to{" "}
                <span className="font-medium text-ink">{email}</span> by the workshop admin.
              </>
            )}
          </p>
        </div>
      </div>
    </Card>
  )
}
