import Link from "next/link"
import { Check, Lock, ArrowRight, MinusCircle } from "lucide-react"
import type { StudentQuizProgress } from "@/types/database"
import { Card } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * One stage of the workshop.
 *
 * The four states are carried by icon, label and border — never by colour
 * alone — so the progression is readable on a projector and to a screen reader:
 *   completed → green check      available → orange, the only call to action
 *   missed    → muted, honest    locked    → muted, no affordance
 */
const STATE = {
  completed: {
    label: "Completed",
    icon: Check,
    ring: "border-ok/40",
    chip: "bg-ok/15 text-ok border-ok/30",
  },
  available: {
    label: "Available now",
    icon: ArrowRight,
    ring: "border-accent/60 shadow-[0_0_0_1px_rgba(245,79,27,0.25),0_10px_34px_-14px_rgba(245,79,27,0.55)]",
    chip: "bg-accent/15 text-accent border-accent/35",
  },
  missed: {
    label: "Session ended",
    icon: MinusCircle,
    ring: "border-line",
    chip: "bg-glass text-ink-faint border-line",
  },
  locked: {
    label: "Locked",
    icon: Lock,
    ring: "border-line",
    chip: "bg-glass text-ink-faint border-line",
  },
} as const

export function QuizCard({ quiz }: { quiz: StudentQuizProgress }) {
  const meta = STATE[quiz.state]
  const Icon = meta.icon
  const dim = quiz.state === "locked" || quiz.state === "missed"

  return (
    <Card className={cn("relative p-5", meta.ring, dim && "opacity-70")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-[var(--radius-chip)] border",
                meta.chip,
              )}
            >
              <Icon className="size-4" strokeWidth={quiz.state === "completed" ? 3 : 2} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{quiz.title}</p>
              <p className="text-xs text-ink-faint">
                {quiz.subtitle} · {quiz.questionCount} questions
              </p>
            </div>
          </div>
        </div>

        {quiz.state === "completed" && quiz.score !== null && (
          <div className="shrink-0 text-right">
            <p className="font-mono text-2xl font-bold tabular-nums leading-none text-ink">
              {quiz.score}
              <span className="text-base text-ink-faint">/{quiz.questionCount}</span>
            </p>
            <p className="mt-1 font-mono text-xs tabular-nums text-ok">
              {Number(quiz.percentage)}%
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--radius-chip)] border px-2.5 py-1 text-xs font-medium",
            meta.chip,
          )}
        >
          {meta.label}
        </span>

        {quiz.state === "available" && (
          <Button asChild size="sm">
            <Link href={`/quiz/${quiz.slug}`}>
              Start
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        )}

        {quiz.state === "completed" && (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/result/${quiz.slug}`}>View result</Link>
          </Button>
        )}

        {quiz.state === "locked" && (
          <span className="text-xs text-ink-faint">Opens during the session</span>
        )}

        {quiz.state === "missed" && (
          <span className="text-xs text-ink-faint">Scored 0 — you can still qualify</span>
        )}
      </div>
    </Card>
  )
}
