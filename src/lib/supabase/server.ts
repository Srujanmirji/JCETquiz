import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { publicEnv } from "@/lib/env"

/**
 * Request-scoped client carrying the caller's session. Still anon-key, so RLS
 * applies. Use this to answer "who is asking?", never to decide a score.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Called from a Server Component; middleware refreshes the session instead.
        }
      },
    },
  })
}
