import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * OAuth landing. Exchanges the code for a session, then hands off to
 * /continue, which is the only place that decides where a student goes.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/continue"
  const oauthError = searchParams.get("error")

  if (oauthError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(oauthError)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=exchange`)
  }

  // Only allow same-origin relative paths through, so ?next= cannot be used as
  // an open redirect.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/continue"
  return NextResponse.redirect(`${origin}${safeNext}`)
}
