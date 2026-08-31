import "server-only"

import { serverEnv } from "@/lib/env"

export interface CertificateEmailInput {
  to: string
  studentName: string
  workshopName: string
  collegeName: string
  score: number
  total: number
  percentage: number
  certificateNumber: string
  pdf: Buffer
  downloadUrl: string | null
  feedbackUrl: string | null
}

/**
 * Sends the certificate through a Google Apps Script web app running on the
 * organisers' own Gmail account.
 *
 * Chosen over a transactional provider because it needs no domain
 * verification — the mail comes from a real Gmail address the students
 * already recognise. The cost is a hard daily quota:
 *
 *   consumer @gmail.com : 100 recipients/day
 *   Google Workspace    : 1,500 recipients/day
 *
 * `getRemainingQuota()` surfaces that in the admin UI so nobody discovers the
 * ceiling halfway through a send.
 */
export async function sendCertificateEmail(input: CertificateEmailInput) {
  const { appsScriptUrl, appsScriptSecret, emailFromName, replyTo } = serverEnv()

  if (!appsScriptUrl || !appsScriptSecret) {
    throw new Error(
      "APPS_SCRIPT_URL and APPS_SCRIPT_SECRET are not configured — see docs/SETUP.md.",
    )
  }

  let res: Response
  try {
    res = await fetch(appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Apps Script answers the /exec URL with a 302 to googleusercontent;
      // fetch follows it by default, which is what we want.
      redirect: "follow",
      body: JSON.stringify({
        secret: appsScriptSecret,
        to: input.to,
        subject: `Your ${input.workshopName} Certificate`,
        fromName: emailFromName,
        replyTo: replyTo || undefined,
        text: certificateEmailText(input),
        html: certificateEmailHtml(input),
        filename: `${input.certificateNumber}.pdf`,
        pdfBase64: input.pdf.toString("base64"),
      }),
      signal: AbortSignal.timeout(60_000),
    })
  } catch (err) {
    throw new Error(
      `Could not reach the Apps Script mailer: ${(err as Error).message}`,
    )
  }

  // Apps Script returns 200 with an HTML error page when the deployment is
  // misconfigured, so the status alone is not enough to trust.
  const raw = await res.text()
  let payload: { ok?: boolean; error?: string; remainingQuota?: number }
  try {
    payload = JSON.parse(raw)
  } catch {
    throw new Error(
      "The Apps Script URL did not return JSON. Check the deployment is a Web App " +
        'with "Who has access: Anyone", and that you copied the /exec URL.',
    )
  }

  if (!payload.ok) {
    throw new Error(
      payload.error === "unauthorized"
        ? "Apps Script rejected the shared secret. APPS_SCRIPT_SECRET must match SHARED_SECRET in Code.gs."
        : (payload.error ?? "Apps Script reported an unknown failure."),
    )
  }

  return { remainingQuota: payload.remainingQuota ?? null }
}

/** Today's remaining send quota, or null when the mailer is unreachable. */
export async function getRemainingQuota(): Promise<number | null> {
  const { appsScriptUrl } = serverEnv()
  if (!appsScriptUrl) return null

  try {
    const res = await fetch(appsScriptUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    })
    const payload = (await res.json()) as { remainingQuota?: number }
    return typeof payload.remainingQuota === "number" ? payload.remainingQuota : null
  } catch {
    return null
  }
}

function certificateEmailText(i: CertificateEmailInput) {
  // Filtering on `null` rather than falsiness — `.filter(Boolean)` would strip
  // the blank lines too and collapse this into one unreadable block.
  return [
    `Hi ${i.studentName},`,
    ``,
    `Congratulations on completing the ${i.workshopName} at ${i.collegeName}.`,
    ``,
    `Your score: ${i.score}/${i.total} (${i.percentage}%)`,
    `Certificate ID: ${i.certificateNumber}`,
    ``,
    `Your certificate is attached to this email as a PDF.`,
    i.downloadUrl ? `You can also download it here: ${i.downloadUrl}` : null,
    ``,
    i.feedbackUrl ? `How was the workshop? Two minutes of feedback: ${i.feedbackUrl}` : null,
    i.feedbackUrl ? `` : null,
    `Well done, and keep building.`,
    `— ${i.collegeName}`,
  ]
    .filter((line) => line !== null)
    .join("\n")
}

/** Table-based layout with inline styles — the only thing mail clients render reliably. */
function certificateEmailHtml(i: CertificateEmailInput) {
  return `<!doctype html>
<html lang="en"><body style="margin:0;padding:0;background:#f4f6f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
<tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e3e8ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <tr><td style="padding:32px 32px 8px;">
      <p style="margin:0;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#6b7684;font-weight:600;">${escapeHtml(i.collegeName)}</p>
      <h1 style="margin:12px 0 0;font-size:23px;line-height:1.3;color:#12203a;font-weight:700;">Your certificate is ready</h1>
    </td></tr>

    <tr><td style="padding:16px 32px 0;">
      <p style="margin:0;font-size:15px;line-height:1.65;color:#334155;">
        Hi ${escapeHtml(i.studentName)},<br><br>
        Congratulations on completing the <strong>${escapeHtml(i.workshopName)}</strong>, covering HTML, CSS, JavaScript and Python. Your certificate is attached to this email as a PDF.
      </p>
    </td></tr>

    <tr><td style="padding:24px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e3e8ef;border-radius:10px;">
        <tr>
          <td style="padding:16px;text-align:center;border-right:1px solid #e3e8ef;">
            <p style="margin:0;font-size:21px;font-weight:700;color:#12203a;">${i.score}/${i.total}</p>
            <p style="margin:4px 0 0;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#6b7684;">Score</p>
          </td>
          <td style="padding:16px;text-align:center;">
            <p style="margin:0;font-size:21px;font-weight:700;color:#12203a;">${i.percentage}%</p>
            <p style="margin:4px 0 0;font-size:10px;letter-spacing:1.2px;text-transform:uppercase;color:#6b7684;">Percentage</p>
          </td>
        </tr>
      </table>
    </td></tr>

    ${
      i.downloadUrl
        ? `<tr><td style="padding:24px 32px 0;" align="center">
             <a href="${i.downloadUrl}" style="display:inline-block;background:#F54F1B;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:8px;">Download your certificate</a>
             <p style="margin:10px 0 0;font-size:12px;color:#6b7684;">This link works for 7 days.</p>
           </td></tr>`
        : ""
    }

    ${
      i.feedbackUrl
        ? `<tr><td style="padding:24px 32px 0;">
             <p style="margin:0;font-size:14px;line-height:1.6;color:#334155;border-top:1px solid #e3e8ef;padding-top:20px;">
               <strong style="color:#12203a;">How was the workshop?</strong><br>
               Two minutes of feedback helps us run the next one better —
               <a href="${escapeHtml(i.feedbackUrl)}" style="color:#F54F1B;font-weight:600;">share yours here</a>.
             </p>
           </td></tr>`
        : ""
    }

    <tr><td style="padding:24px 32px 32px;">
      <p style="margin:0;font-size:12px;color:#6b7684;border-top:1px solid #e3e8ef;padding-top:16px;">
        Certificate ID: <span style="font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(i.certificateNumber)}</span><br>
        Keep this ID for your records.
      </p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  )
}
