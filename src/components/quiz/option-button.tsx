"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A large, unambiguous answer target.
 *
 * The marker carries the option's NUMBER when unselected, because the footer
 * tells students to "press 1-4" — an anonymous radio dot leaves that shortcut
 * unmapped to anything on screen. Selection then swaps the number for a check,
 * so the state is signalled four ways (border, glow, fill, check) and never by
 * colour alone.
 */
export function OptionButton({
  index,
  label,
  selected,
  onSelect,
  questionId,
}: {
  index: number
  label: string
  selected: boolean
  onSelect: () => void
  questionId: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      name={`q-${questionId}`}
      onClick={onSelect}
      className={cn(
        "group relative flex w-full items-center gap-3.5 overflow-hidden rounded-[var(--radius-input)] border px-4 py-4 text-left",
        "min-h-[58px] transition-[border-color,background,box-shadow,transform] duration-200 ease-[var(--ease-out-soft)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        selected
          ? [
              "border-accent/80",
              "bg-[linear-gradient(135deg,rgba(245,79,27,0.25)_0%,rgba(30,34,61,0.5)_100%)]",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_0_0_1px_rgba(245,79,27,0.3),0_8px_28px_-8px_rgba(245,79,27,0.5)]",
            ]
          : [
              "border-line",
              "bg-[rgba(30,34,61,0.35)]",
              "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
              "hover:-translate-y-px hover:border-line-strong hover:bg-[rgba(30,34,61,0.55)]",
            ],
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-all duration-150",
          selected
            ? "border-accent bg-accent text-[#1a0d06] shadow-[0_0_14px_-2px_#F54F1B]"
            : "border-line-strong bg-canvas/50 text-ink-muted group-hover:border-ink-muted group-hover:text-ink",
        )}
      >
        {selected ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
      </span>

      <span className="text-[15px] font-medium leading-snug text-ink">{label}</span>
    </button>
  )
}
