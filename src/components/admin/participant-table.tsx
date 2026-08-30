import Link from "next/link"
import { Users } from "lucide-react"
import type { ParticipantRow } from "@/lib/admin/queries"
import { TableWrap, Table, Th, Td, Tr } from "@/components/admin/table"
import { DataSurface } from "@/components/ui/surface"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/states"
import { Button } from "@/components/ui/button"
import { QUIZZES, QUESTIONS_PER_QUIZ, TOTAL_QUESTIONS } from "@/lib/constants"

function Score({ row, slug }: { row: ParticipantRow; slug: (typeof QUIZZES)[number]["slug"] }) {
  const s = row.scores[slug]
  if (!s) return <span className="text-ink-faint">—</span>
  if (s.status === "started") return <span className="text-warn text-xs">in progress</span>
  return (
    <span className="text-ink">
      {s.score}
      <span className="text-ink-faint">/{QUESTIONS_PER_QUIZ}</span>
    </span>
  )
}

function Eligibility({ row }: { row: ParticipantRow }) {
  if (!row.final || row.final.quizzes_completed === 0) return <Badge>Not started</Badge>
  return row.final.certificate_eligible ? (
    <Badge tone="ok">Eligible</Badge>
  ) : (
    <Badge>Not eligible</Badge>
  )
}

function CertBadge({ row }: { row: ParticipantRow }) {
  if (!row.certificate) return <span className="text-ink-faint">—</span>
  const tone = { sent: "ok", generated: "info", sending: "warn", failed: "bad", eligible: "neutral" } as const
  const label = { sent: "Sent", generated: "Ready", sending: "Sending", failed: "Failed", eligible: "Pending" }
  return <Badge tone={tone[row.certificate.status]}>{label[row.certificate.status]}</Badge>
}

export function ParticipantTable({ rows }: { rows: ParticipantRow[] }) {
  if (rows.length === 0) {
    return (
      <DataSurface>
        <EmptyState
          icon={Users}
          title="No participants match these filters"
          description="Try clearing the search box or widening the branch and status filters."
        />
      </DataSurface>
    )
  }

  return (
    <>
      <TableWrap className="hidden lg:block">
        <Table className="min-w-[960px]">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Branch</Th>
              {QUIZZES.map((q) => (
                <Th key={q.slug} align="right">{q.subtitle}</Th>
              ))}
              <Th align="right">Total</Th>
              <Th align="right">%</Th>
              <Th>Eligibility</Th>
              <Th>Certificate</Th>
              <Th align="right" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Tr key={row.id}>
                <Td className="font-medium text-ink">
                  <Link
                    href={`/admin/participants/${row.id}`}
                    className="rounded-[var(--radius-chip)] hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {row.name}
                  </Link>
                  <span className="block max-w-[200px] truncate text-2xs font-normal text-ink-faint">
                    {row.email}
                  </span>
                </Td>
                <Td className="whitespace-nowrap text-xs">{row.branch}</Td>
                {QUIZZES.map((q) => (
                  <Td key={q.slug} align="right" className="font-mono tabular-nums">
                    <Score row={row} slug={q.slug} />
                  </Td>
                ))}
                <Td align="right" className="font-mono font-semibold tabular-nums text-ink">
                  {row.final ? `${row.final.total_score}/${row.final.total_questions}` : "—"}
                </Td>
                <Td align="right" className="font-mono tabular-nums">
                  {row.final ? `${Number(row.final.percentage)}%` : "—"}
                </Td>
                <Td><Eligibility row={row} /></Td>
                <Td><CertBadge row={row} /></Td>
                <Td align="right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/participants/${row.id}`}>View</Link>
                  </Button>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableWrap>

      {/* Mobile: one card per row (docs/UI-DESIGN.md — tables become cards). */}
      <ul className="space-y-2.5 lg:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <DataSurface className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{row.name}</p>
                  <p className="truncate text-xs text-ink-faint">{row.branch}</p>
                </div>
                <p className="shrink-0 font-mono text-xl font-semibold tabular-nums text-ink">
                  {row.final?.total_score ?? "—"}
                  <span className="text-sm text-ink-faint">/{TOTAL_QUESTIONS}</span>
                </p>
              </div>

              <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-line pt-3 text-center">
                {QUIZZES.map((q) => (
                  <div key={q.slug}>
                    <dt className="text-2xs uppercase tracking-wide text-ink-faint">{q.subtitle}</dt>
                    <dd className="mt-0.5 font-mono text-sm tabular-nums text-ink">
                      <Score row={row} slug={q.slug} />
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <div className="flex flex-wrap gap-2">
                  <Eligibility row={row} />
                  <CertBadge row={row} />
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/admin/participants/${row.id}`}>View</Link>
                </Button>
              </div>
            </DataSurface>
          </li>
        ))}
      </ul>
    </>
  )
}
