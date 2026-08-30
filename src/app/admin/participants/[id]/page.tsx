import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getParticipant } from "@/lib/admin/queries"
import { DataSurface } from "@/components/ui/surface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CertificateActions } from "@/components/admin/certificate-actions"
import { ResetAttempt } from "@/components/admin/reset-attempt"
import { formatDateTime } from "@/lib/utils"
import { QUIZZES, QUESTIONS_PER_QUIZ, TOTAL_QUESTIONS, PASS_SCORE } from "@/lib/constants"

export const metadata: Metadata = { title: "Participant" }
export const dynamic = "force-dynamic"

export default async function ParticipantDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const row = await getParticipant(id)
  if (!row) notFound()

  const final = row.final
  const allDone = (final?.quizzes_completed ?? 0) >= QUIZZES.length

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link href="/admin/participants">
          <ArrowLeft className="size-4" aria-hidden />
          All participants
        </Link>
      </Button>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{row.name}</h1>
          <p className="mt-1 text-sm text-ink-muted">{row.email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {final && final.quizzes_completed > 0 && (
            <Badge tone={final.certificate_eligible ? "ok" : "neutral"}>
              {final.certificate_eligible ? "Certificate Eligible" : "Not eligible"}
            </Badge>
          )}
          <Badge>{final?.quizzes_completed ?? 0} of {QUIZZES.length} quizzes</Badge>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <DataSurface className="p-5">
            <h2 className="text-sm font-medium text-ink">Quiz progress</h2>

            <ul className="mt-4 divide-y divide-line border-t border-line">
              {QUIZZES.map((q) => {
                const s = row.scores[q.slug]
                return (
                  <li key={q.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{q.title}</p>
                      <p className="text-xs text-ink-faint">
                        {!s ? "Not attempted" : s.status === "started" ? "In progress" : "Completed"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-semibold tabular-nums text-ink">
                        {s && s.status === "completed" ? s.score : "—"}
                        <span className="text-sm text-ink-faint">/{QUESTIONS_PER_QUIZ}</span>
                      </span>
                      {s && <ResetAttempt profileId={row.id} slug={q.slug} quizTitle={q.title} />}
                    </div>
                  </li>
                )
              })}
            </ul>

            {final && (
              <div className="mt-4 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-line pt-4">
                <div>
                  <p className="font-mono text-3xl font-bold tabular-nums tracking-[-0.03em] text-ink">
                    {final.total_score}
                    <span className="text-lg text-ink-faint">/{final.total_questions}</span>
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-ink-faint">Overall</p>
                </div>
                <div>
                  <p className="font-mono text-3xl font-bold tabular-nums tracking-[-0.03em] text-ink">
                    {Number(final.percentage)}%
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-ink-faint">Percentage</p>
                </div>
              </div>
            )}
          </DataSurface>

          <DataSurface className="p-5">
            <h2 className="text-sm font-medium text-ink">Registration</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {([
                ["Name", row.name],
                ["Email", row.email],
                ["Phone", row.phone],
                ["Branch", row.branch],
                ["Year", row.year],
                ["Registered", formatDateTime(row.created_at)],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
                  <dd className="mt-1 break-words text-sm text-ink">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </DataSurface>
        </div>

        <DataSurface className="h-fit p-5">
          <h2 className="text-sm font-medium text-ink">Certificate</h2>

          {!final || final.quizzes_completed === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">
              Available once this student has taken at least one quiz.
            </p>
          ) : !final.certificate_eligible ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Scored {final.total_score}/{TOTAL_QUESTIONS}, below the {PASS_SCORE}-mark threshold.
              {!allDone && " Sessions are still running, so this can still change."}
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Certificate ID</dt>
                  <dd className="mt-1 font-mono text-xs text-ink">
                    {row.certificate?.certificate_number ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-ink-faint">Status</dt>
                  <dd className="mt-1">
                    <Badge tone={row.certificate?.status === "sent" ? "ok" : "neutral"}>
                      {row.certificate?.status ?? "eligible"}
                    </Badge>
                  </dd>
                </div>
                {row.certificate?.sent_at && (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-ink-faint">Sent</dt>
                    <dd className="mt-1 text-sm text-ink">{formatDateTime(row.certificate.sent_at)}</dd>
                  </div>
                )}
              </dl>

              <div className="border-t border-line pt-4">
                <CertificateActions
                  certificateId={row.certificate?.id ?? null}
                  status={row.certificate?.status ?? null}
                  eligible
                  studentName={row.name}
                />
              </div>
            </div>
          )}
        </DataSurface>
      </div>
    </>
  )
}
