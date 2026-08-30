import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Radius encodes surface role, so the hierarchy is legible before you read a
 * word: page panel (24) > card (16) > input (12) > chip (8).
 *
 * Glass is for elevated surfaces only. Dense admin data uses DataSurface,
 * which is opaque and unblurred (docs/UI-DESIGN.md).
 */

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass-strong lit rounded-[var(--radius-panel)]", className)}
      {...props}
    />
  )
}

export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "glass lit rounded-[var(--radius-card)]",
        interactive &&
          "transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 hover:border-line-strong",
        className,
      )}
      {...props}
    />
  )
}

/** Opaque surface for dense admin data — no blur, no translucency. */
export function DataSurface({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-elevated shadow-[0_10px_28px_-18px_rgba(0,0,0,0.8)]",
        className,
      )}
      {...props}
    />
  )
}
