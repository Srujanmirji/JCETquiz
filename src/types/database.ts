import type { QuizSlug } from "@/lib/constants"

export type SessionState = "locked" | "open" | "closed"
export type AttemptStatus = "started" | "completed"
export type CertificateStatus = "eligible" | "generated" | "sending" | "sent" | "failed"

/** What a quiz looks like on a student's dashboard. */
export type QuizState = "completed" | "available" | "missed" | "locked"

export interface Profile {
  id: string
  name: string
  email: string
  phone: string
  branch: string
  year: string
  created_at: string
  updated_at: string
}

export interface Quiz {
  id: string
  slug: QuizSlug
  title: string
  subtitle: string | null
  question_count: number
  order_index: number
  session_state: SessionState
  opened_at: string | null
  closed_at: string | null
  is_active: boolean
}

/** What the student's browser is allowed to see. Note the absence of an answer key. */
export interface PublicQuestion {
  id: string
  quiz_id: string
  quiz_slug: QuizSlug
  question_text: string
  options: [string, string, string, string]
  position: number
}

/** Server-only. Never serialise this to a client component or an API response. */
export interface AdminQuestion {
  id: string
  quiz_id: string
  question_text: string
  options: [string, string, string, string]
  correct_option: number
  explanation: string | null
  is_active: boolean
  position: number
  created_at: string
}

export interface QuizAttempt {
  id: string
  profile_id: string
  quiz_id: string
  status: AttemptStatus
  started_at: string
  submitted_at: string | null
  score: number | null
  total_questions: number | null
  percentage: number | null
}

export interface FinalResult {
  id: string
  profile_id: string
  html_score: number
  css_score: number
  javascript_score: number
  python_score: number
  total_score: number
  total_questions: number
  percentage: number
  quizzes_completed: number
  certificate_eligible: boolean
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: string
  profile_id: string
  final_result_id: string
  certificate_name: string
  certificate_number: string
  file_path: string | null
  status: CertificateStatus
  last_error: string | null
  sent_at: string | null
  sent_by: string | null
  email: string | null
  created_at: string
}

export interface WorkshopSettings {
  id: boolean
  college_name: string
  workshop_name: string
  event_date: string
  organizer_name: string
  organizer_title: string
  certificate_prefix: string
  quiz_open: boolean
  randomize_questions: boolean
  lock_year: boolean
  updated_at: string
}

/** One row of the student dashboard, straight from student_progress(). */
export interface StudentQuizProgress {
  slug: QuizSlug
  title: string
  subtitle: string | null
  orderIndex: number
  questionCount: number
  sessionState: SessionState
  score: number | null
  percentage: number | null
  state: QuizState
}

export interface StudentProgress {
  quizzes: StudentQuizProgress[]
  workshopComplete: boolean
  final: FinalResult | null
}

export interface QuizStat {
  slug: QuizSlug
  title: string
  orderIndex: number
  sessionState: SessionState
  started: number
  inProgress: number
  completed: number
  average: number
  highest: number
  lowest: number
}

export interface DashboardMetrics {
  totalParticipants: number
  perQuiz: QuizStat[]
  allCompleted: number
  eligible: number
  certificatesSent: number
  averageTotal: number
  workshopComplete: boolean
}

/** The per-quiz result returned by the submit endpoint. */
export interface QuizResult {
  slug: QuizSlug
  score: number
  totalQuestions: number
  percentage: number
}
