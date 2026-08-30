import type { Metadata } from "next"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { StudentShell } from "@/components/marketing/shell"
import { Panel } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Admin access required" }

/**
 * Lives OUTSIDE /admin on purpose. A child layout does not replace its parent,
 * so a page under /admin would still run the admin guard — and redirecting an
 * unauthorised user there would loop forever.
 */
export default function NoAccessPage() {
  return (
    <StudentShell width="narrow">
      <Panel className="p-8 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-[var(--radius-input)] border border-line bg-glass">
          <ShieldAlert className="size-5 text-ink-muted" aria-hidden />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-[-0.01em] text-ink">
          Admin access required
        </h1>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm leading-relaxed text-ink-muted">
          This account is not on the organiser list. If you are running the workshop, ask whoever
          set up the project to add you — the steps are in <code className="font-mono text-xs text-ink">docs/SETUP.md</code>,
          step 6.
        </p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button asChild variant="secondary">
            <Link href="/continue">Go to my quiz</Link>
          </Button>
        </div>
      </Panel>
    </StudentShell>
  )
}
