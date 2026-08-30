import { Suspense } from "react"
import type { Metadata } from "next"
import { StudentShell } from "@/components/marketing/shell"
import { Logo } from "@/components/marketing/logo"
import { Panel } from "@/components/ui/surface"
import { Skeleton } from "@/components/ui/states"
import { GoogleSignIn } from "@/components/marketing/google-sign-in"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <StudentShell width="narrow">
      <Panel className="mx-auto w-full max-w-[420px] p-7 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <Logo size={44} />
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-accent-soft">
            Web Development Workshop
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-ink">
            Welcome back
          </h1>
          <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-ink-muted">
            Sign in with your Google account to continue.
          </p>
        </div>

        <div className="mt-7">
          <Suspense fallback={<Skeleton className="h-13 w-full rounded-[var(--radius-input)]" />}>
            <GoogleSignIn />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-xs leading-relaxed text-ink-faint">
          We use your Google name and email to issue your certificate. Nothing else is collected
          from your Google account.
        </p>
      </Panel>
    </StudentShell>
  )
}
