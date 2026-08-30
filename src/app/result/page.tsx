import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { requireUser, getProfile } from "@/lib/auth/guards"
import { getStudentProgress } from "@/lib/quiz/service"
import { createClient } from "@/lib/supabase/server"
import type { Certificate } from "@/types/database"
import { StudentShell } from "@/components/marketing/shell"
import { Panel } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import { ScoreDisplay } from "@/components/result/score-display"
import { CertificateStatusCard } from "@/components/result/certificate-status"
import { SignOutButton } from "@/components/marketing/sign-out-button"
import { PASS_SCORE, TOTAL_QUESTIONS } from "@/lib/constants"

export const metadata: Metadata = { title: "Final result" }
export const dynamic = "force-dynamic"

/**
 * The workshop's final result. Permanent — a returning student always lands
 * here on the same stored numbers.
 *
 * Gated on every session being CLOSED rather than on the student having done
 * all four, so someone who missed a session still sees a result at the end.
 */
export default async function FinalResultPage() {
  const user = await requireUser()
  const profile = await getProfile(user.id)
  if (!profile) redirect("/register")

  const progress = await getStudentProgress(profile.id)
  if (!progress.workshopComplete) redirect("/dashboard")

  const final = progress.final
  if (!final) redirect("/dashboard")

  const supabase = await createClient()
  const { data: cert } = await supabase
    .from("certificates")
    .select("status, sent_at, certificate_number")
    .eq("profile_id", profile.id)
    .maybeSingle()

  const certificate = cert as Pick<
    Certificate, "status" | "sent_at" | "certificate_number"
  > | null

  return (
    <StudentShell width="narrow" meta={<SignOutButton />}>
      <div className="space-y-8">
        <header className="space-y-1.5 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-accent">
            Workshop complete
          </p>
          <p className="text-sm text-ink-muted">
            {profile.name.split(" ")[0]}, here is your final result
          </p>
          <h1 className="sr-only">Your final workshop result</h1>
        </header>

        <Panel className="bloom px-6 py-10 sm:px-10 sm:py-12">
          <ScoreDisplay
            score={final.total_score}
            total={final.total_questions}
            percentage={Number(final.percentage)}
            tone={final.certificate_eligible ? "ok" : "accent"}
            caption={
              final.certificate_eligible
                ? `You cleared the ${PASS_SCORE}-mark needed for a certificate.`
                : `${PASS_SCORE} out of ${TOTAL_QUESTIONS} is the mark for a certificate.`
            }
          />
        </Panel>

        {/* ---- per-quiz breakdown ---- */}
        <section aria-labelledby="breakdown" className="space-y-3">
          <h2 id="breakdown" className="text-sm font-medium text-ink-muted">
            Breakdown
          </h2>

          <ul className="space-y-2.5">
            {progress.quizzes.map((q) => {
              const score = q.score ?? 0
              const pct = (score / q.questionCount) * 100
              return (
                <li key={q.slug}>
                  <div className="flex items-center gap-3.5">
                    <span className="w-24 shrink-0 text-sm text-ink">{q.subtitle}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full border border-line bg-[rgba(0,0,0,0.35)]">
                      <div
                        className={`h-full rounded-full ${score === 0 ? "" : "bg-accent"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                      {score}
                      <span className="text-ink-faint">/{q.questionCount}</span>
                    </span>
                  </div>
                  {q.state === "missed" && (
                    <p className="mt-1 pl-[7.5rem] text-2xs text-ink-faint">
                      Session missed
                    </p>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-3.5 border-t border-line pt-3">
            <span className="w-24 shrink-0 text-sm font-medium text-ink">Total</span>
            <div className="flex-1" />
            <span className="shrink-0 font-mono text-base font-bold tabular-nums text-ink">
              {final.total_score}
              <span className="text-ink-faint">/{final.total_questions}</span>
            </span>
          </div>
        </section>

        <CertificateStatusCard
          eligible={final.certificate_eligible}
          status={certificate?.status ?? null}
          sentAt={certificate?.sent_at ?? null}
          email={profile.email}
        />

        <div className="flex justify-center">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    </StudentShell>
  )
}
