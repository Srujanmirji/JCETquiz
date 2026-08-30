import Link from "next/link"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { ArrowLeft, User } from "lucide-react"
import { requireUser, getProfile } from "@/lib/auth/guards"
import { createClient } from "@/lib/supabase/server"
import { StudentShell } from "@/components/marketing/shell"
import { Panel } from "@/components/ui/surface"
import { RegistrationForm } from "@/components/marketing/registration-form"

export const metadata: Metadata = { title: "Complete Your Profile" }

export default async function RegisterPage() {
  const user = await requireUser()
  const profile = await getProfile(user.id)


  const supabase = await createClient()
  const { data: settings } = await supabase
    .from("workshop_settings")
    .select("lock_year")
    .maybeSingle()

  // Google gives us a verified name and email; the name is a starting point the
  // student may correct, the email is fixed (docs/PRD.md §3).
  const googleName =
    (user.user_metadata?.["full_name"] as string | undefined) ??
    (user.user_metadata?.["name"] as string | undefined) ??
    ""

  return (
    <StudentShell
      width="narrow"
      meta={
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          <span>Back</span>
        </Link>
      }
    >
      <div className="mx-auto w-full max-w-[480px]">
        <Panel className="p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            {/* Avatar Circle */}
            <div className="relative mb-4 grid size-16 place-items-center rounded-full border border-accent/40 bg-accent/10 shadow-state-accent">
              <User className="size-8 text-accent" strokeWidth={1.75} aria-hidden />
            </div>

            <h1 className="text-2xl font-semibold tracking-[-0.025em] text-ink sm:text-3xl">
              Complete Your Profile
            </h1>
            <p className="mt-1.5 text-sm text-ink-muted">
              We need a few details to get you started
            </p>
          </div>

          <div className="mt-6 border-t border-line/70 pt-6">
            <RegistrationForm
              email={user.email ?? ""}
              defaultName={profile?.name ?? googleName}
              defaultPhone={profile?.phone ?? ""}
              defaultBranch={profile?.branch ?? ""}
              defaultYear={profile?.year ?? "1st Year"}
              lockYear={settings?.lock_year ?? true}
              isUpdate={Boolean(profile)}
            />
          </div>
        </Panel>
      </div>
    </StudentShell>
  )
}
