/**
 * CSV serialisation for the admin export.
 *
 * Two things worth being careful about:
 *
 * 1. Formula injection. Excel and Sheets execute a cell beginning with
 *    = + - @ (or tab/CR), so a student who registers as "=1+1" or
 *    "=HYPERLINK(...)" becomes a live formula in whatever the organisers open.
 *    Prefixing with a single quote neutralises it while still displaying the
 *    original text.
 *
 * 2. UTF-8. Excel assumes the system codepage unless a BOM is present, which
 *    mangles any non-ASCII name. The BOM is prepended in `toCsv`.
 */

const NEEDS_ESCAPE = /^[=+\-@\t\r]/

function cell(value: unknown): string {
  if (value === null || value === undefined) return ""

  let s = String(value)
  if (NEEDS_ESCAPE.test(s)) s = `'${s}`

  // Quote when the value contains a delimiter, quote or newline; double any
  // embedded quotes, per RFC 4180.
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: readonly string[], rows: readonly unknown[][]): string {
  const body = [headers.map(cell).join(","), ...rows.map((r) => r.map(cell).join(","))]
  // \r\n line endings, which Excel handles most predictably.
  return "﻿" + body.join("\r\n") + "\r\n"
}

/** e.g. participants-2026-08-31.csv */
export function exportFilename(prefix: string, date = new Date()): string {
  const iso = date.toISOString().slice(0, 10)
  return `${prefix}-${iso}.csv`
}
