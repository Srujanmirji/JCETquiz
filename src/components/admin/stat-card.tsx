import { DataSurface } from "@/components/ui/surface"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  sub,
  subTone = "neutral",
  icon: Icon,
  accent = "neutral",
}: {
  label: string
  value: string | number
  sub?: string
  subTone?: "neutral" | "ok" | "warn" | "bad"
  icon: React.ComponentType<{ className?: string }>
  accent?: "neutral" | "ok" | "info" | "orange"
}) {
  const tone = {
    neutral: "text-ink-faint",
    ok: "text-ok",
    info: "text-cyan",
    orange: "text-accent",
  }[accent]

  const subColor = {
    neutral: "text-ink-faint",
    ok: "text-ok font-medium",
    warn: "text-warn font-medium",
    bad: "text-bad font-medium",
  }[subTone]

  return (
    <DataSurface className="p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
        <div className="grid size-8 place-items-center rounded-[var(--radius-chip)] bg-[rgba(255,255,255,0.04)] border border-line">
          <Icon className={cn("size-4 shrink-0", tone)} aria-hidden />
        </div>
      </div>
      <p className="mt-2 font-mono text-3xl font-bold tabular-nums tracking-[-0.03em] text-ink sm:text-4xl">
        {value}
      </p>
      {sub && <p className={cn("mt-1.5 text-xs", subColor)}>{sub}</p>}
    </DataSurface>
  )
}
