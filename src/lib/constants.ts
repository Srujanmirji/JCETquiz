/** Single source of truth for the workshop's shape. Mirrors supabase/migrations/0008. */

export const QUIZZES = [
  { slug: "html",       title: "HTML Quiz",       subtitle: "Structure",   order: 1 },
  { slug: "css",        title: "CSS Quiz",        subtitle: "Styling",     order: 2 },
  { slug: "javascript", title: "JavaScript Quiz", subtitle: "Behaviour",   order: 3 },
  { slug: "python",     title: "Python Quiz",     subtitle: "Programming", order: 4 },
] as const

export type QuizSlug = (typeof QUIZZES)[number]["slug"]

export const QUIZ_SLUGS = QUIZZES.map((q) => q.slug) as readonly QuizSlug[]

export const QUESTIONS_PER_QUIZ = 10
export const TOTAL_QUESTIONS = QUIZZES.length * QUESTIONS_PER_QUIZ // 40

/**
 * Eligibility is a raw-score threshold, not a percentage comparison.
 * 28/40 is exactly 70%; comparing integers keeps floating point away from the
 * boundary entirely. The database applies the same rule in recompute_final_result.
 */
export const PASS_SCORE = 28
export const PASS_PERCENTAGE = 70

export function isQuizSlug(value: string): value is QuizSlug {
  return (QUIZ_SLUGS as readonly string[]).includes(value)
}

export function quizMeta(slug: QuizSlug) {
  return QUIZZES.find((q) => q.slug === slug)!
}

export const BRANCHES = [
  "Computer Science",
  "Artificial Intelligence & Machine Learning",
  "Electronics & Communication",
  "Civil",
  "Mechanical",
] as const

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const

/** localStorage key prefix for an in-progress draft. Never authoritative. */
export const draftKey = (slug: QuizSlug) => `wdw:quiz:${slug}:draft:v2`
