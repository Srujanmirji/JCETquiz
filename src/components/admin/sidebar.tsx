"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Award,
  LayoutDashboard,
  ListChecks,
  Menu,
  Settings,
  Trophy,
  Users,
  X,
} from "lucide-react"
import { Logo } from "@/components/marketing/logo"
import { SignOutButton } from "@/components/marketing/sign-out-button"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/participants", label: "Participants", icon: Users },
  { href: "/admin/results", label: "Quiz Results", icon: Trophy },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/questions", label: "Questions", icon: ListChecks },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] satisfies ReadonlyArray<{
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
}>

/**
 * Opaque sidebar — no glass, no blur. Admin surfaces prioritise readability
 * over effect (docs/UI-DESIGN.md).
 */
export function AdminSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const nav = (
    <nav aria-label="Admin sections" className="flex flex-1 flex-col gap-1 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-[var(--radius-input)] px-3.5 text-sm transition-all duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              active
                ? "bg-accent font-semibold text-on-accent shadow-[0_4px_16px_-4px_rgba(245,79,27,0.5)]"
                : "text-ink-muted hover:bg-[rgba(255,255,255,0.05)] hover:text-ink",
            )}
          >
            <Icon className={cn("size-4 shrink-0", active ? "text-on-accent" : "text-ink-muted")} aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Mobile bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-elevated px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Logo size={26} />
          <div className="leading-none">
            <span className="text-sm font-bold tracking-tight text-ink">WDW</span>
            <span className="ml-1 text-2xs font-semibold uppercase tracking-wider text-accent">Admin</span>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="grid size-11 place-items-center rounded-[var(--radius-input)] text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Menu className="size-5" />
        </button>
      </div>
      <div className="h-14 lg:hidden" aria-hidden />

      {open && (
        <button
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-line bg-elevated",
          "transition-transform duration-200 ease-[var(--ease-out-soft)] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b border-line px-4">
          <Link href="/admin" className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-chip)]">
            <Logo size={28} />
            <div className="leading-none">
              <span className="block text-sm font-bold tracking-tight text-ink">WDW</span>
              <span className="mt-0.5 block text-2xs font-semibold uppercase tracking-wider text-accent">Admin</span>
            </div>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="grid size-11 place-items-center rounded-[var(--radius-input)] text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {nav}

        <div className="border-t border-line p-3">
          <SignOutButton />
        </div>
      </aside>
    </>
  )
}
