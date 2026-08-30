import Link from "next/link"
import { Logo } from "@/components/marketing/logo"
import { cn } from "@/lib/utils"

/** Centred single-column shell for the whole student flow. */
export function StudentShell({
  children,
  width = "narrow",
  meta,
}: {
  children: React.ReactNode
  width?: "narrow" | "wide"
  meta?: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/40 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Link
            href="/"
            className="-mx-2 flex min-h-11 items-center gap-2.5 rounded-[var(--radius-chip)] px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Logo size={28} />
            <span className="leading-none">
              <span className="block text-sm font-semibold tracking-wide text-ink">WDW</span>
              <span className="mt-1 block text-2xs uppercase tracking-[0.18em] text-ink-muted">
                Workshop
              </span>
            </span>
          </Link>
          {meta}
        </div>
      </header>

      <main
        id="main"
        className={cn(
          "mx-auto flex w-full flex-1 flex-col justify-center px-5 py-10 sm:py-14",
          width === "narrow" ? "max-w-[640px]" : "max-w-6xl",
        )}
      >
        {children}
      </main>

      <footer className="border-t border-line px-5 py-6">
        <p className="mx-auto max-w-6xl text-xs text-ink-faint">
          Web Development Workshop · HTML, CSS &amp; JavaScript
        </p>
      </footer>
    </div>
  )
}
