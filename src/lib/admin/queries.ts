import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { QuizSlug } from "@/lib/constants"
import type {
  AdminQuestion,
  Certificate,
  DashboardMetrics,
  FinalResult,
  Profile,
  Quiz,
  WorkshopSettings,
} from "@/types/database"

/**
 * Admin read layer. Every caller must have passed `requireAdmin()` first —
 * these use the service role and perform no authorisation of their own, which
 * is why they are never exported to a client component.
 */

export type ScoreMap = Partial<Record<QuizSlug, { score: number | null; status: string }>>

export type ParticipantRow = Profile & {
  scores: ScoreMap
  final: FinalResult | null
  certificate: Pick<Certificate, "id" | "status" | "sent_at" | "certificate_number"> | null
}

export interface ParticipantFilters {
  search?: string
  branch?: string
  status?: "all" | "completed" | "in_progress" | "not_started"
  eligibility?: "all" | "eligible" | "not_eligible"
  sort?: "score_desc" | "score_asc" | "recent" | "name"
  page?: number
  pageSize?: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("admin_dashboard")
  if (error) throw error
  return data as unknown as DashboardMetrics
}

export async function getQuizzes(): Promise<Quiz[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("quizzes").select("*").order("order_index")
  if (error) throw error
  return (data ?? []) as Quiz[]
}

/** Flattens each student's four attempts into one row per participant. */
export async function getParticipants(filters: ParticipantFilters = {}) {
  const {
    search = "", branch = "", status = "all", eligibility = "all",
    sort = "recent", page = 1, pageSize = 25,
  } = filters

  const admin = createAdminClient()

  let query = admin.from("profiles").select(
    `*,
     attempts:quiz_attempts(score, status, quiz:quizzes(slug)),
     final:final_results(*),
     certificate:certificates(id, status, sent_at, certificate_number)`,
    { count: "exact" },
  )

  if (search.trim()) {
    const term = `%${search.trim().replace(/[%_,]/g, "")}%`
    query = query.or(`name.ilike.${term},email.ilike.${term}`)
  }
  if (branch) query = query.eq("branch", branch)

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)
  query = sort === "name"
    ? query.order("name", { ascending: true })
    : query.order("created_at", { ascending: false })

  const { data, error, count } = await query
  if (error) throw error

  const one = <T,>(v: T | T[] | null): T | null =>
    Array.isArray(v) ? (v[0] ?? null) : v

  let rows: ParticipantRow[] = (data ?? []).map((raw) => {
    const r = raw as unknown as Profile & {
      attempts: { score: number | null; status: string; quiz: { slug: QuizSlug } | { slug: QuizSlug }[] }[]
      final: FinalResult | FinalResult[] | null
      certificate: ParticipantRow["certificate"] | ParticipantRow["certificate"][]
    }

    const scores: ScoreMap = {}
    for (const a of r.attempts ?? []) {
      const quiz = one(a.quiz)
      if (quiz) scores[quiz.slug] = { score: a.score, status: a.status }
    }

    return {
      ...r,
      scores,
      final: one(r.final),
      certificate: one(r.certificate),
    }
  })

  if (status !== "all") {
    rows = rows.filter((r) => {
      const completed = r.final?.quizzes_completed ?? 0
      if (status === "completed")   return completed >= 4
      if (status === "in_progress") return completed > 0 && completed < 4
      return completed === 0
    })
  }

  if (eligibility !== "all") {
    rows = rows.filter((r) =>
      eligibility === "eligible"
        ? r.final?.certificate_eligible === true
        : !r.final?.certificate_eligible,
    )
  }

  if (sort === "score_desc" || sort === "score_asc") {
    const dir = sort === "score_desc" ? -1 : 1
    rows.sort((a, b) => dir * ((a.final?.total_score ?? -1) - (b.final?.total_score ?? -1)))
  }

  return { rows, total: count ?? rows.length, page, pageSize }
}

export async function getParticipant(id: string): Promise<ParticipantRow | null> {
  const { rows } = await getParticipants({ pageSize: 1000 })
  return rows.find((r) => r.id === id) ?? null
}

export async function getBranches(): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin.from("profiles").select("branch")
  const set = new Set((data ?? []).map((r) => (r as { branch: string }).branch))
  return [...set].sort()
}

export async function getQuestions(quizId?: string): Promise<AdminQuestion[]> {
  const admin = createAdminClient()
  let q = admin.from("questions").select("*").order("position")
  if (quizId) q = q.eq("quiz_id", quizId)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as AdminQuestion[]
}

/** Question ids that have been graded — these are frozen (docs/ADMIN.md). */
export async function getLockedQuestionIds(): Promise<Set<string>> {
  const admin = createAdminClient()
  const { data } = await admin.from("quiz_answers").select("question_id")
  return new Set((data ?? []).map((r) => (r as { question_id: string }).question_id))
}

export async function getSettings(): Promise<WorkshopSettings> {
  const admin = createAdminClient()
  const { data, error } = await admin.from("workshop_settings").select("*").single()
  if (error) throw error
  return data as WorkshopSettings
}

export type CertificateRow = Certificate & {
  profile: Pick<Profile, "id" | "name" | "email" | "branch"> | null
  final: Pick<FinalResult, "total_score" | "total_questions" | "percentage"> | null
}

export async function getCertificates(status?: string): Promise<CertificateRow[]> {
  const admin = createAdminClient()
  let q = admin
    .from("certificates")
    .select(`*,
      profile:profiles(id, name, email, branch),
      final:final_results(total_score, total_questions, percentage)`)
    .order("created_at", { ascending: false })

  if (status && status !== "all") q = q.eq("status", status)

  const { data, error } = await q
  if (error) throw error

  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)

  return (data ?? []).map((raw) => {
    const r = raw as unknown as CertificateRow & {
      profile: CertificateRow["profile"] | CertificateRow["profile"][]
      final: CertificateRow["final"] | CertificateRow["final"][]
    }
    return { ...r, profile: one(r.profile), final: one(r.final) }
  })
}
