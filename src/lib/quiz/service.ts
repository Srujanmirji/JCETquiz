import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import type { QuizSlug } from "@/lib/constants"
import type {
  PublicQuestion,
  Quiz,
  QuizAttempt,
  StudentProgress,
  WorkshopSettings,
} from "@/types/database"

/**
 * Server-side quiz operations. Both the API routes and the pages call these, so
 * the session gate, the one-attempt rule and the scoring path have exactly one
 * implementation each.
 */

export async function getSettings(): Promise<WorkshopSettings | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("workshop_settings").select("*").maybeSingle()
  return data as WorkshopSettings | null
}

export async function getQuizzes(): Promise<Quiz[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("quizzes")
    .select("*")
    .eq("is_active", true)
    .order("order_index")
  if (error) throw error
  return (data ?? []) as Quiz[]
}

export async function getQuiz(slug: QuizSlug): Promise<Quiz | null> {
  const admin = createAdminClient()
  const { data } = await admin.from("quizzes").select("*").eq("slug", slug).maybeSingle()
  return data as Quiz | null
}

/** Per-quiz dashboard state for one student, computed in the database. */
export async function getStudentProgress(profileId: string): Promise<StudentProgress> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("student_progress", { p_profile_id: profileId })
  if (error) throw error
  return data as unknown as StudentProgress
}

/** Throws with a Postgres code: P0001 already completed, P0002 session not open. */
export async function startQuizAttempt(
  profileId: string,
  slug: QuizSlug,
): Promise<QuizAttempt> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("start_quiz_attempt", {
    p_profile_id: profileId,
    p_slug: slug,
  })
  if (error) throw error
  return data as unknown as QuizAttempt
}

export async function getQuestions(slug: QuizSlug): Promise<PublicQuestion[]> {
  const admin = createAdminClient()

  // Explicit column list, so the answer key cannot ride along even though this
  // client bypasses RLS.
  const { data, error } = await admin
    .from("public_questions")
    .select("id, quiz_id, quiz_slug, question_text, options, position")
    .eq("quiz_slug", slug)
    .order("position")

  if (error) throw error
  return (data ?? []) as PublicQuestion[]
}

export interface SubmittedAnswer {
  questionId: string
  selectedOption: number | null
}

export async function submitQuiz(
  profileId: string,
  slug: QuizSlug,
  answers: SubmittedAnswer[],
): Promise<QuizAttempt> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("submit_quiz", {
    p_profile_id: profileId,
    p_slug: slug,
    p_answers: answers.map((a) => ({
      question_id: a.questionId,
      selected_option: a.selectedOption,
    })),
  })
  if (error) throw error
  return data as unknown as QuizAttempt
}

// ------------------------------------------------------------ session control
export async function openSession(slug: QuizSlug): Promise<Quiz> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("open_quiz_session", { p_slug: slug })
  if (error) throw error
  return data as unknown as Quiz
}

export async function closeSession(slug: QuizSlug): Promise<Quiz> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("close_quiz_session", { p_slug: slug })
  if (error) throw error
  return data as unknown as Quiz
}

/** Auto-submits anyone still mid-quiz, then closes. Returns how many were submitted. */
export async function forceCloseSession(slug: QuizSlug): Promise<number> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc("force_close_quiz_session", { p_slug: slug })
  if (error) throw error
  return (data as unknown as number) ?? 0
}

export async function resetAttempt(profileId: string, slug: QuizSlug): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin.rpc("admin_reset_attempt", {
    p_profile_id: profileId,
    p_slug: slug,
  })
  if (error) throw error
}
