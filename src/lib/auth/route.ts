import "server-only"

import { getProfile } from "@/lib/auth/guards"

/**
 * The single place that decides where a signed-in student belongs.
 *
 * With four quizzes the destination is always the dashboard once a profile
 * exists — the dashboard itself shows what is open, completed, or locked, so
 * there is one screen the student can always return to.
 */
export type StudentDestination = "/register" | "/dashboard"

export async function resolveStudentRoute(userId: string): Promise<StudentDestination> {
  const profile = await getProfile(userId)
  return profile ? "/dashboard" : "/register"
}
