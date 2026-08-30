"use client"

import { useEffect, useState } from "react"

/**
 * THE signature element (docs/UI-DESIGN.md; project CLAUDE.md).
 *
 * All of the visual boldness in this product is spent here and nowhere else:
 * a conic ring whose sweep IS the percentage, a halo whose intensity tracks
 * the score, and the score itself set in mono at the top of the type scale.
 *
 * The ring sweeps once on mount — a real state change, not decoration — and
 * is static under prefers-reduced-motion.
 */
export function ScoreDisplay({
  score,
  total,
  percentage,
  tone,
  caption,
}: {
  score: number
  total: number
  percentage: number
  tone: "ok" | "accent"
  caption?: string
}) {
  const [swept, setSwept] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSwept(true)
      return
    }
    const id = requestAnimationFrame(() => setSwept(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const sweep = swept ? percentage : 0
  const ring = tone === "ok" ? "#10B981" : "#F54F1B"
  const ringEnd = tone === "ok" ? "#34D399" : "#FF7A45"
  // Halo intensity tracks the result, so a strong score visibly glows more.
  const halo = 0.22 + (percentage / 100) * 0.4

  return (
    <div className="relative flex flex-col items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[120px] size-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[70px] transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle, color-mix(in srgb, ${ring} 60%, transparent) 0%, transparent 66%)`,
          opacity: swept ? halo : 0,
        }}
      />

      <div className="relative grid size-[240px] place-items-center sm:size-[264px]">
        {/* Recessed track */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.6)",
            maskImage: RING_MASK,
            WebkitMaskImage: RING_MASK,
          }}
        />
        {/* Sweep */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full transition-[background] duration-[1100ms] ease-[var(--ease-out-soft)]"
          style={{
            background: `conic-gradient(from -90deg, ${ring} 0%, ${ringEnd} ${sweep * 0.75}%, ${ring} ${sweep}%, transparent ${sweep}%)`,
            maskImage: RING_MASK,
            WebkitMaskImage: RING_MASK,
            filter: `drop-shadow(0 0 14px color-mix(in srgb, ${ring} 65%, transparent))`,
          }}
        />
        {/* Specular arc */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-full opacity-60"
          style={{
            background: "conic-gradient(from -90deg, rgba(255, 255, 255, 0.5) 0%, transparent 14%)",
            maskImage: RING_MASK_THIN,
            WebkitMaskImage: RING_MASK_THIN,
          }}
        />

        <div className="relative flex flex-col items-center">
          <p className="flex items-baseline gap-1 font-mono tabular-nums">
            <span
              className="text-[64px] font-bold leading-none tracking-[-0.045em] text-ink sm:text-[84px]"
              style={{
                textShadow: `0 0 50px color-mix(in srgb, ${ring} 50%, transparent), 0 2px 14px rgba(0, 0, 0, 0.6)`,
              }}
            >
              {score}
            </span>
            <span className="text-2xl font-medium leading-none text-ink-muted sm:text-3xl">
              /{total}
            </span>
          </p>
        </div>

        <span className="sr-only">
          You scored {score} out of {total}, which is {percentage} percent.
        </span>
      </div>

      <p
        className="mt-6 font-mono text-5xl font-bold tabular-nums tracking-[-0.04em]"
        style={{
          color: ring,
          textShadow: `0 0 36px color-mix(in srgb, ${ring} 45%, transparent)`,
        }}
      >
        {percentage % 1 === 0 ? percentage : percentage.toFixed(2)}%
      </p>

      {caption && <p className="mt-3 text-sm text-ink-muted">{caption}</p>}
    </div>
  )
}

// 12px annulus, and a thinner one for the specular arc.
const RING_MASK =
  "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 12px))"
const RING_MASK_THIN =
  "radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 12px), #000 calc(100% - 8px), transparent calc(100% - 8px))"
