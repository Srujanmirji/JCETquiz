import "server-only"

import type { QuizSlug } from "@/lib/constants"
import type { AnswerReview } from "@/types/database"
import { getAnswerReview } from "@/lib/quiz/service"
import { AnswerReviewContent } from "./answer-review"

/** Mounted only after the result page has verified identity and completion. */
export async function AnswerReviewSection({ profileId, slug }: { profileId: string; slug: QuizSlug }) {
  let review: AnswerReview | null = null
  try {
    review = await getAnswerReview(profileId, slug)
  } catch {
    // Fail closed without making the student's already-saved score unavailable.
    console.error("[answer-review] Could not load review")
  }
  return <AnswerReviewContent review={review} slug={slug} />
}
