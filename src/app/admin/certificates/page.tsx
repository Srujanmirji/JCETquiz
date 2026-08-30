import type { Metadata } from "next"
import { Award } from "lucide-react"
import { getCertificates } from "@/lib/admin/queries"
import { PageHeader } from "@/components/admin/page-header"
import { TableWrap, Table, Th, Td, Tr } from "@/components/admin/table"
import { DataSurface } from "@/components/ui/surface"
import { Badge } from "@/components/ui/badge"
import { EmptyState, Alert } from "@/components/ui/states"
import { CertificateActions } from "@/components/admin/certificate-actions"
import { CertificateFilter } from "@/components/admin/certificate-filter"
import { formatDateTime } from "@/lib/utils"
import { TOTAL_QUESTIONS } from "@/lib/constants"

export const metadata: Metadata = { title: "Certificates" }
export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const STATUS_TONE = {
  sent: "ok",
  generated: "info",
  sending: "info",
  failed: "bad",
  eligible: "neutral",
} as const

const STATUS_LABEL = {
  sent: "Sent",
  generated: "Ready to send",
  sending: "Sending…",
  failed: "Failed",
  eligible: "Awaiting send",
}

export default async function CertificatesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const status = (Array.isArray(sp["status"]) ? sp["status"][0] : sp["status"]) ?? "all"

  const rows = await getCertificates(status)
  const pending = rows.filter((r) => r.status !== "sent").length
  const failed = rows.filter((r) => r.status === "failed")

  return (
    <>
      <PageHeader
        title="Certificates"
        description={
          rows.length === 0
            ? "Eligible students appear here automatically."
            : `${rows.length} eligible · ${pending} still to send.`
        }
        action={<CertificateFilter />}
      />

      {failed.length > 0 && status === "all" && (
        <div className="mb-4">
          <Alert tone="warn">
            {failed.length} certificate{failed.length > 1 ? "s" : ""} failed to send. The most
            common cause is an unverified sending domain in Resend — check the error on the row and
            retry.
          </Alert>
        </div>
      )}

      {rows.length === 0 ? (
        <DataSurface>
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="A certificate record is created automatically the moment a student scores 21 or more."
          />
        </DataSurface>
      ) : (
        <>
          <TableWrap className="hidden lg:block">
            <Table className="min-w-[900px]">
              <thead>
                <tr>
                  <Th>Student</Th>
                  <Th>Email</Th>
                  <Th align="right">Score</Th>
                  <Th>Certificate ID</Th>
                  <Th>Status</Th>
                  <Th>Sent</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Tr key={row.id}>
                    <Td className="font-medium text-ink">{row.profile?.name ?? "—"}</Td>
                    <Td className="max-w-[200px] truncate text-xs">{row.profile?.email}</Td>
                    <Td align="right" className="font-mono tabular-nums text-ink">
                      {row.final?.total_score ?? "—"}
                      <span className="text-ink-faint">/{row.final?.total_questions ?? TOTAL_QUESTIONS}</span>
                    </Td>
                    <Td className="font-mono text-xs">{row.certificate_number}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                      {row.status === "failed" && row.last_error && (
                        <p className="mt-1 max-w-[220px] truncate text-2xs text-bad" title={row.last_error}>
                          {row.last_error}
                        </p>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{formatDateTime(row.sent_at)}</Td>
                    <Td align="right">
                      <CertificateActions
                        certificateId={row.id}
                        status={row.status}
                        eligible
                        studentName={row.profile?.name ?? "the student"}
                        compact
                      />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>

          <ul className="space-y-2.5 lg:hidden">
            {rows.map((row) => (
              <li key={row.id}>
                <DataSurface className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{row.profile?.name}</p>
                      <p className="truncate text-xs text-ink-faint">{row.profile?.email}</p>
                    </div>
                    <p className="shrink-0 font-mono text-lg font-semibold tabular-nums text-ink">
                      {row.final?.total_score ?? "—"}
                      <span className="text-sm text-ink-faint">/{TOTAL_QUESTIONS}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                    <span className="font-mono text-2xs text-ink-faint">
                      {row.certificate_number}
                    </span>
                  </div>

                  {row.status === "failed" && row.last_error && (
                    <p className="mt-2 text-xs text-bad">{row.last_error}</p>
                  )}

                  <div className="mt-3 border-t border-line pt-3">
                    <CertificateActions
                      certificateId={row.id}
                      status={row.status}
                      eligible
                      studentName={row.profile?.name ?? "the student"}
                    />
                  </div>
                </DataSurface>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
