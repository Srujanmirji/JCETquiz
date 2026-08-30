import "server-only"

import { Resend } from "resend"
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
}

/**
 * Sends the certificate. The PDF is attached AND a signed link is included:
 * the attachment is what a student keeps, the link is the fallback when a
 * college mail filter strips attachments (docs/CERTIFICATES.md).
 */
export async function sendCertificateEmail(input: CertificateEmailInput) {
  const { resendApiKey, emailFrom } = serverEnv()

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured — see docs/SETUP.md step 3.")
  }

  const resend = new Resend(resendApiKey)

  const { data, error } = await resend.emails.send({
    from: emailFrom,
    to: input.to,
    subject: `Your ${input.workshopName} Certificate`,
    html: certificateEmailHtml(input),
    text: certificateEmailText(input),
    attachments: [
      {
        filename: `${input.certificateNumber}.pdf`,
        content: input.pdf.toString("base64"),
      },
    ],
  })

  if (error) throw new Error(error.message ?? "Resend rejected the message")
  return data
}

function certificateEmailText(i: CertificateEmailInput) {
  return [
    `Hi ${i.studentName},`,
    ``,
    `Congratulations on completing the ${i.workshopName} at ${i.collegeName}.`,
    ``,
    `Your score: ${i.score}/${i.total} (${i.percentage}%)`,
    `Certificate ID: ${i.certificateNumber}`,
    ``,
    `Your certificate is attached to this email as a PDF.`,
    i.downloadUrl ? `You can also download it here: ${i.downloadUrl}` : ``,
    ``,
    `Well done, and keep building.`,
    `— ${i.collegeName}`,
  ]
    .filter(Boolean)
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
        Congratulations on completing the <strong>${escapeHtml(i.workshopName)}</strong>. Your certificate is attached to this email as a PDF.
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
             <a href="${i.downloadUrl}" style="display:inline-block;background:#2c5fd0;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 28px;border-radius:8px;">Download your certificate</a>
             <p style="margin:10px 0 0;font-size:12px;color:#6b7684;">This link works for 7 days.</p>
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
