import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-glass text-ink-muted border border-line",
        ok: "bg-ok/15 text-ok border border-ok/30",
        warn: "bg-warn/15 text-warn border border-warn/30",
        bad: "bg-bad/15 text-bad border border-bad/30",
        info: "bg-cyan/15 text-cyan border border-cyan/30",
        orange: "bg-accent/15 text-accent-soft border border-accent/30",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
)

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />
}
