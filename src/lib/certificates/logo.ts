import { CLUB_LOGO_DATA_URI } from "@/lib/certificates/logo-data"

/**
 * The club logo for the certificate.
 *
 * Returns an inlined data URI rather than a filesystem path. `public/` is
 * served by the CDN and is not reliably readable from inside a serverless
 * function, so the previous fs lookup rendered locally and failed on Vercel.
 *
 * Returns null when no logo is bundled, and the template falls back to the
 * drawn mark — a missing logo must never break a certificate send.
 */
export function clubLogoPath(): string | null {
  return CLUB_LOGO_DATA_URI || null
}
