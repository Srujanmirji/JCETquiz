/**
 * Deletes the stored certificate PDFs.
 *
 *   npm run reset:files          # dry run — lists what would go
 *   npm run reset:files -- --yes # actually deletes
 *
 * The storage half of the between-workshops reset. The SQL half clears the
 * database rows, but `delete from storage.objects` is blocked by Supabase
 * (storage.protect_delete) — files have to go through the Storage API, which
 * is what this does.
 *
 * Dry run by default. There is no undo, and a PDF that is still referenced by
 * a certificate row would leave that student unable to download.
 */
import { createClient } from "@supabase/supabase-js"

const url = process.env["NEXT_PUBLIC_SUPABASE_URL"]
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.")
  process.exit(1)
}

const BUCKET = "certificates"
const confirmed = process.argv.includes("--yes")
const db = createClient(url, serviceKey, { auth: { persistSession: false } })

/** The bucket is one folder per profile, so a flat list() is not enough. */
async function walk(prefix = ""): Promise<string[]> {
  const { data, error } = await db.storage.from(BUCKET).list(prefix, { limit: 1000 })
  if (error) throw new Error(`list ${prefix || "/"}: ${error.message}`)
  const found: string[] = []
  for (const entry of data ?? []) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    // A folder comes back with a null id and no metadata.
    if (entry.id === null) found.push(...(await walk(path)))
    else found.push(path)
  }
  return found
}

const files = await walk()

if (files.length === 0) {
  console.log(`${BUCKET}: already empty.`)
  process.exit(0)
}

// Say how many are orphans, so a run against live data is obviously wrong.
const { count: liveCertificates } = await db
  .from("certificates")
  .select("id", { count: "exact", head: true })

console.log(`${BUCKET}: ${files.length} file(s)`)
for (const f of files) console.log(`  ${f}`)
console.log(`certificates table currently holds ${liveCertificates ?? "?"} row(s).`)

if (!confirmed) {
  console.log("\nDry run — nothing deleted. Re-run with --yes to delete.")
  process.exit(0)
}

const { error } = await db.storage.from(BUCKET).remove(files)
if (error) {
  console.error(`Delete failed: ${error.message}`)
  process.exit(1)
}

const left = await walk()
console.log(`\nDeleted ${files.length} file(s). ${left.length} remaining.`)
