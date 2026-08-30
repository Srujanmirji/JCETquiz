import Link from "next/link"
import { Award, CheckCircle2, Mail, Users, Percent } from "lucide-react"
import { getDashboardMetrics, getQuizzes } from "@/lib/admin/queries"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { SessionControl } from "@/components/admin/session-control"
import { DataSurface } from "@/components/ui/surface"
import { TableWrap, Table, Th, Td, Tr } from "@/components/admin/table"
import { Button } from "@/components/ui/button"
import { TOTAL_QUESTIONS, QUESTIONS_PER_QUIZ } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [metrics, quizzes] = await Promise.all([getDashboardMetrics(), getQuizzes()])

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Run the workshop from here."
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/certificates">Certificates</Link>
          </Button>
        }
      />

      {/* The instructor's primary control on event day, above everything else. */}
      <SessionControl quizzes={quizzes} stats={metrics.perQuiz} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Participants" value={metrics.totalParticipants} icon={Users} />
        <StatCard
          label="All 4 Completed"
          value={metrics.allCompleted}
          sub={`of ${metrics.totalParticipants} registered`}
          icon={CheckCircle2}
        />
        <StatCard
          label="Certificate Eligible"
          value={metrics.eligible}
          sub={`${TOTAL_QUESTIONS > 0 ? "28" : ""}/${TOTAL_QUESTIONS} or more`}
          icon={Award}
          accent="ok"
        />
        <StatCard
          label="Certificates Sent"
          value={metrics.certificatesSent}
          sub={`${Math.max(metrics.eligible - metrics.certificatesSent, 0)} still to send`}
          icon={Mail}
          accent="info"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Average Total"
          value={metrics.averageTotal}
          sub={`out of ${TOTAL_QUESTIONS}`}
          icon={Percent}
        />
      </div>

      {/* ---- per-quiz analytics ---- */}
      <section className="mt-8" aria-labelledby="analytics">
        <h2 id="analytics" className="mb-3 text-sm font-medium text-ink">
          Quiz analytics
        </h2>

        {metrics.perQuiz.length === 0 ? (
          <DataSurface className="p-6 text-center text-sm text-ink-muted">
            No quizzes configured.
          </DataSurface>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Quiz</Th>
                  <Th>Session</Th>
                  <Th align="right">Started</Th>
                  <Th align="right">In progress</Th>
                  <Th align="right">Completed</Th>
                  <Th align="right">Average</Th>
                  <Th align="right">Highest</Th>
                  <Th align="right">Lowest</Th>
                </tr>
              </thead>
              <tbody>
                {metrics.perQuiz.map((q) => (
                  <Tr key={q.slug}>
                    <Td className="font-medium text-ink">{q.title}</Td>
                    <Td className="text-xs capitalize">{q.sessionState}</Td>
                    <Td align="right" className="font-mono tabular-nums">{q.started}</Td>
                    <Td align="right" className="font-mono tabular-nums">{q.inProgress}</Td>
                    <Td align="right" className="font-mono tabular-nums text-ink">{q.completed}</Td>
                    <Td align="right" className="font-mono tabular-nums">
                      {q.completed > 0 ? `${q.average}/${QUESTIONS_PER_QUIZ}` : "—"}
                    </Td>
                    <Td align="right" className="font-mono tabular-nums">
                      {q.completed > 0 ? q.highest : "—"}
                    </Td>
                    <Td align="right" className="font-mono tabular-nums">
                      {q.completed > 0 ? q.lowest : "—"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </section>
    </>
  )
}
