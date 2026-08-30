import { redirect } from "next/navigation"
import { requireUser } from "@/lib/auth/guards"
import { resolveStudentRoute } from "@/lib/auth/route"
import { isAdmin } from "@/lib/auth/guards"

/**
 * The post-login junction. Every sign-in lands here, and this page — running on
 * the server against the database — decides where the student belongs.
 *
 * This is what makes "already completed → results" hold no matter how the
 * student arrived: fresh login, refresh, second tab, or a different device.
 */
export default async function ContinuePage() {
  const user = await requireUser()

  if (await isAdmin(user.id)) redirect("/admin")

  redirect(await resolveStudentRoute(user.id))
}
