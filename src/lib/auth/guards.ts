import "server-only"

import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Profile } from "@/types/database"

export async function getUser(): Promise<User | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** Redirects to login when unauthenticated. Use in Server Components. */
export async function requireUser(): Promise<User> {
  const user = await getUser()
  if (!user) redirect("/login")
  return user
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle()
  return data as Profile | null
}

/**
 * Admin check. Reads through the service role so it cannot be defeated by an
 * RLS misconfiguration on admin_users, and is re-run on every request — there
 * is no cached or client-supplied admin flag anywhere in this app.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle()
  return Boolean(data)
}

export async function requireAdmin(): Promise<User> {
  const user = await getUser()
  if (!user) redirect("/login?next=/admin")
  // /no-access lives outside /admin so this redirect cannot loop through
  // the admin layout guard.
  if (!(await isAdmin(user.id))) redirect("/no-access")
  return user
}

/** API-route variant: returns a user or null instead of redirecting. */
export async function requireAdminApi(): Promise<User | null> {
  const user = await getUser()
  if (!user) return null
  return (await isAdmin(user.id)) ? user : null
}
