import * as React from "react"
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * The four states every data surface ships. Skeletons mirror the real layout's
 * shape so the page does not jump when content arrives.
 */

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-[var(--radius-chip)] bg-glass-strong", className)}
      {...props}
    />
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string
  description: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="grid size-11 place-items-center rounded-[var(--radius-input)] border border-line bg-glass">
        <Icon className="size-5 text-ink-faint" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium text-ink">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string
  description: string
  onRetry?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
    >
      <div className="grid size-11 place-items-center rounded-[var(--radius-input)] border border-bad/30 bg-bad/10">
        <AlertTriangle className="size-5 text-bad" />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium text-ink">{title}</p>
        <p className="mx-auto max-w-sm text-sm text-ink-muted">{description}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      )}
    </div>
  )
}

/** Inline banner for form-level failures. */
export function Alert({
  tone = "bad",
  children,
}: {
  tone?: "bad" | "warn" | "info"
  children: React.ReactNode
}) {
  const tones = {
    bad: "border-bad/30 bg-bad/10 text-bad",
    warn: "border-warn/30 bg-warn/10 text-warn",
    info: "border-accent/30 bg-accent/10 text-accent-soft",
  } as const

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-[var(--radius-input)] border px-3.5 py-3 text-sm",
        tones[tone],
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="[&_a]:underline">{children}</div>
    </div>
  )
}
