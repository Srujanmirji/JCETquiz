import { requireAdminApi } from "@/lib/auth/guards"
import { ok, fail } from "@/lib/api"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  loadCertificateContext,
  generateAndStore,
  signedCertificateUrl,
  toCertificateData,
} from "@/lib/certificates/generate"
import { sendCertificateEmail } from "@/lib/email/resend"
import { TOTAL_QUESTIONS } from "@/lib/constants"

/**
 * POST /api/admin/certificates/:id/send
 *
 * Guarded per docs/ADMIN.md:
 *  - below threshold → 409, the send never happens
 *  - already sent    → refused unless ?resend=1 is passed explicitly
 *
 * Generation is idempotent, so a retry after a failed send re-renders and
 * re-uploads rather than emailing a stale document.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin_user = await requireAdminApi()
  if (!admin_user) return fail("forbidden", "Admin access required.")

  const { id } = await params
  const resend = new URL(request.url).searchParams.get("resend") === "1"

  const loaded = await loadCertificateContext(id)
  if (!loaded.ok) {
    return loaded.reason === "not_eligible"
      ? fail("not_eligible", "This student scored below the certificate threshold.")
      : fail("not_found", "Certificate not found.")
  }

  const { certificate, profile, settings } = loaded.ctx

  if (certificate.status === "sent" && !resend) {
    return fail("conflict", "This certificate has already been sent. Use Resend to send it again.")
  }

  const admin = createAdminClient()

  // Compare-and-set claim prevents concurrent first sends from both reaching
  // the provider. Explicit resend remains allowed only for a previously sent
  // certificate.
  const { data: claimed, error: claimError } = await admin
    .from("certificates")
    .update({ status: "sending", last_error: null })
    .eq("id", id)
    .in("status", resend ? ["eligible", "generated", "failed", "sent"] : ["eligible", "generated", "failed"])
    .select("id")
    .maybeSingle()

  if (claimError) {
    console.error("[certificate] send claim failed", { id, message: claimError.message })
    return fail("server_error", "Could not start certificate delivery. Please try again.")
  }
  if (!claimed) {
    return fail("conflict", "This certificate is already being sent. Please wait for it to finish.")
  }

  try {
    const { path, pdf } = await generateAndStore(loaded.ctx, { markGenerated: false })
    const downloadUrl = await signedCertificateUrl(path)
    const data = toCertificateData(loaded.ctx)

    await sendCertificateEmail({
      to: profile.email,
      studentName: data.studentName,
      workshopName: data.workshopName,
      collegeName: data.collegeName,
      score: data.score,
      total: TOTAL_QUESTIONS,
      percentage: data.percentage,
      certificateNumber: data.certificateNumber,
      pdf,
      downloadUrl,
    })

    // Audit trail: who sent it and when (docs/CERTIFICATES.md).
    const { data: audited, error: auditError } = await admin
      .from("certificates")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        sent_by: admin_user.id,
        file_path: path,
        last_error: null,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (auditError) throw auditError
    if (!audited) throw new Error("Certificate delivery audit update affected no rows")

    return ok({ status: "sent", email: profile.email })
  } catch (err) {
    const message = (err as { message?: string })?.message ?? "Unknown error"
    console.error("[certificate] send failed", { id, message })

    const { error: failureAuditError } = await admin
      .from("certificates")
      .update({ status: "failed", last_error: message.slice(0, 300) })
      .eq("id", id)

    if (failureAuditError) {
      console.error("[certificate] failed-send audit update failed", {
        id,
        message: failureAuditError.message,
      })
    }

    // Surface the provider's own wording — an unverified Resend domain is the
    // single most common cause here and the message says exactly that.
    return fail("server_error", `Could not send the email: ${message}`)
  }
}

// Certificate rendering needs more headroom than the default edge budget.
export const maxDuration = 60
