/**
 * Regenerates src/lib/certificates/logo-data.ts from public/club-logo-mark.jpg.
 *
 *   node scripts/build-logo.mjs
 *
 * Run this after replacing the logo. Keep the source small — it is embedded in
 * every certificate PDF, and a 437 KB source is what broke rendering on Vercel.
 */
import { readFileSync, writeFileSync } from "node:fs"

const SOURCE = "public/club-logo-mark.jpg"
const raw = readFileSync(SOURCE)

if (raw.length > 60_000) {
  console.warn(`⚠  ${SOURCE} is ${(raw.length / 1024).toFixed(0)} KB — resize it below ~40 KB.`)
}

const uri = `data:image/jpeg;base64,${raw.toString("base64")}`
writeFileSync(
  "src/lib/certificates/logo-data.ts",
  `/**\n * The club logo, inlined as a data URI.\n *\n * Generated from ${SOURCE} by scripts/build-logo.mjs.\n *\n * Deliberately NOT read from the filesystem at request time: \`public/\` is\n * served by the CDN and is not reliably present inside a serverless function,\n * so an fs read works locally and fails in production.\n */\nexport const CLUB_LOGO_DATA_URI =\n  "${uri}"\n`,
)
console.log(`logo-data.ts regenerated — ${(uri.length / 1024).toFixed(1)} KB inline`)
