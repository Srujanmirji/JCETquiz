import { redirect } from "next/navigation"

/**
 * There is no single quiz any more — each one lives at /quiz/[slug].
 *
 * Kept as a redirect rather than a 404 because old links, bookmarks and any
 * stale ?next=/quiz from a previous session all land here, and a student
 * hitting "Page not found" straight after signing in has no idea what to do.
 */
export default function QuizIndexPage() {
  redirect("/dashboard")
}
