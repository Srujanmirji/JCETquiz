import { Mail, AlertTriangle } from "lucide-react"
import { DataSurface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"

/**
 * Today's remaining Gmail send quota.
 *
 * Apps Script sends from a real Gmail account, which has a hard daily ceiling
 * (100 on a consumer address, 1,500 on Workspace). Showing it up front means
 * nobody discovers the limit two-thirds of the way through a batch.
 */
export function QuotaBanner({
  remaining,
  pending,
}: {
  remaining: number | null
  pending: number
}) {
  if (remaining === null) {
    return (
      <DataSurface className="mb-4 flex items-start gap-3 border-warn/30 p-4">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
        <div>
          <p className="text-sm font-medium text-ink">Mailer not reachable</p>
          <p className="mt-1 max-w-[70ch] text-xs leading-relaxed text-ink-muted">
            Could not reach the Apps Script web app. Check <code className="font-mono text-ink">APPS_SCRIPT_URL</code> in
            your environment, and that the deployment is a Web App with access set to “Anyone”.
            Certificates cannot be sent until this resolves.
          </p>
        </div>
      </DataSurface>
    )
  }

  const short = pending > remaining

  return (
    <DataSurface className={cn("mb-4 flex items-start gap-3 p-4", short && "border-warn/40")}>
      {short ? (
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
      ) : (
        <Mail className="mt-0.5 size-4 shrink-0 text-ink-faint" aria-hidden />
      )}
      <div>
        <p className="text-sm font-medium text-ink">
          <span className="font-mono tabular-nums">{remaining}</span> email
          {remaining === 1 ? "" : "s"} left in today’s Gmail quota
        </p>
        <p className="mt-1 max-w-[70ch] text-xs leading-relaxed text-ink-muted">
          {short ? (
            <>
              <span className="text-warn">
                {pending} certificates still to send — {pending - remaining} more than today’s
                quota allows.
              </span>{" "}
              Send what you can now and finish tomorrow, or switch the script to a Google
              Workspace account (1,500/day instead of 100).
            </>
          ) : (
            <>Enough for the {pending} certificate{pending === 1 ? "" : "s"} still to send. The quota resets daily.</>
          )}
        </p>
      </div>
    </DataSurface>
  )
}
