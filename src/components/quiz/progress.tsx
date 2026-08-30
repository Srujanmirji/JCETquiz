import { cn } from "@/lib/utils"

export function QuizProgress({
  current,
  total,
  answered,
}: {
  current: number
  total: number
  answered: number
}) {
  const pct = Math.round((answered / total) * 100)

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-ink">
          Question <span className="tnum">{current}</span> of <span className="tnum">{total}</span>
        </p>
        <p className="tnum text-xs font-semibold text-accent">
          {pct}%
        </p>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full border border-line bg-[rgba(8,10,20,0.5)]"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${answered} of ${total} questions answered`}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-[var(--ease-out-soft)]",
            "bg-[linear-gradient(90deg,#F54F1B,#FF7A45)]",
            "shadow-[0_0_12px_rgba(245,79,27,0.7)]",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
