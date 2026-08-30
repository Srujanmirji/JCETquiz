/**
 * Formats the workshop date for the certificate.
 *
 * The workshop spans two days, so a single date would be wrong. Renders
 * "August 31 and September 1, 2026" across a month boundary, "August 30 and
 * 31, 2026" within one month, and a plain date when there is no end date.
 */
export function formatEventDate(start: string, end?: string | null): string {
  const s = new Date(start)
  const month = (d: Date) => d.toLocaleDateString("en-IN", { month: "long" })
  const day = (d: Date) => d.getDate()

  if (!end) {
    return `${month(s)} ${day(s)}, ${s.getFullYear()}`
  }

  const e = new Date(end)
  if (s.getTime() === e.getTime()) {
    return `${month(s)} ${day(s)}, ${s.getFullYear()}`
  }

  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  return sameMonth
    ? `${month(s)} ${day(s)} and ${day(e)}, ${s.getFullYear()}`
    : `${month(s)} ${day(s)} and ${month(e)} ${day(e)}, ${e.getFullYear()}`
}
