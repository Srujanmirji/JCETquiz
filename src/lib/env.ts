/**
 * Fail fast and loudly on misconfiguration. A missing key at 9am on event day
 * should be a startup error with a name attached, not a null-pointer in a
 * request handler while 200 students are queued.
 */
function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. See docs/SETUP.md and .env.example.`,
    )
  }
  return value
}

/** Safe to read in the browser. */
export const publicEnv = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
}

/**
 * Server-only. Importing this from a client component is a build error, which
 * is the point — the service role key must never reach a bundle.
 */
export function serverEnv() {
  return {
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    resendApiKey: process.env.RESEND_API_KEY ?? "",
    emailFrom: process.env.EMAIL_FROM ?? "Workshop <onboarding@resend.dev>",
  }
}
