import "server-only"

import { existsSync } from "node:fs"
import path from "node:path"

/**
 * Absolute path to the club logo for the certificate, or null.
 *
 * Drop the club logo at `public/club-logo.png` (or .jpg) and it is used
 * automatically; without it the certificate falls back to the drawn mark, so a
 * missing file never breaks a send.
 */
export function clubLogoPath(): string | null {
  // Prefer the cropped monogram: the full asset repeats the wordmark we
  // already set in type, which turns to mush at 46px.
  for (const name of [
    "club-logo-mark.png",
    "club-logo.png",
    "club-logo.jpg",
    "club-logo.jpeg",
  ]) {
    const candidate = path.join(process.cwd(), "public", name)
    if (existsSync(candidate)) return candidate
  }
  return null
}
