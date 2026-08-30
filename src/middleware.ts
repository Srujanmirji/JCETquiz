import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * First line of defence, not the only one. Every protected page and API route
 * re-checks authentication and admin membership server-side; this layer exists
 * to keep the session cookie fresh and to bounce obvious unauthenticated hits
 * before they reach a handler.
 */
export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname, search } = request.nextUrl

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/result") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/admin")

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url)
  }

  // A signed-in user landing on /login has nothing to do there.
  if (user && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone()
    url.pathname = "/continue"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
