import { cn } from "@/lib/utils"

/**
 * The workshop mark. Three stacked strokes standing for HTML, CSS and JS —
 * drawn, not an emoji, and the only place the accent gradient appears as a
 * foreground fill.
 */
export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn("shrink-0", className)}
      role="img"
      aria-label="Web Development Workshop"
    >
      <defs>
        <linearGradient id="wdw-mark" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F54F1B" />
          <stop offset="1" stopColor="#FF7A45" />
        </linearGradient>
        <linearGradient id="wdw-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E223D" stopOpacity="0.8" />
          <stop offset="1" stopColor="#12162B" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#wdw-bg)" stroke="url(#wdw-mark)" strokeWidth="1.5" />
      <path
        d="M15 13.5 9.5 20l5.5 6.5M25 13.5 30.5 20 25 26.5M22.2 11.5l-4.4 17"
        stroke="url(#wdw-mark)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
