import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"
import { createAdminClient } from "@/lib/supabase/admin"
import { CertificateDocument, type CertificateData } from "@/lib/certificates/template"
import type { Certificate, FinalResult, Profile, WorkshopSettings } from "@/types/database"

export const CERTIFICATE_BUCKET = "certificates"

export interface CertificateContext {
  certificate: Certificate
  profile: Profile
  result: FinalResult
  settings: WorkshopSettings
}

/**
 * Loads everything a certificate needs and re-verifies eligibility from the
 * stored final result. A certificate is never issued from a client-supplied
 * flag, and never before the workshop has finished.
 */
export async function loadCertificateContext(
  certificateId: string,
): Promise<
  | { ok: true; ctx: CertificateContext }
  | { ok: false; reason: "not_found" | "not_eligible" | "workshop_open" }
> {
  const admin = createAdminClient()

  const { data: cert } = await admin
    .from("certificates").select("*").eq("id", certificateId).maybeSingle()
  if (!cert) return { ok: false, reason: "not_found" }
  const certificate = cert as Certificate

  const [{ data: profile }, { data: result }, { data: settings }, { data: complete }] =
    await Promise.all([
      admin.from("profiles").select("*").eq("id", certificate.profile_id).maybeSingle(),
      admin.from("final_results").select("*").eq("id", certificate.final_result_id).maybeSingle(),
      admin.from("workshop_settings").select("*").single(),
      admin.rpc("workshop_complete"),
    ])

  if (!profile || !result || !settings) return { ok: false, reason: "not_found" }

  const r = result as FinalResult
  if (!r.certificate_eligible) return { ok: false, reason: "not_eligible" }
  if (complete !== true) return { ok: false, reason: "workshop_open" }

  return {
    ok: true,
    ctx: {
      certificate,
      profile: profile as Profile,
      result: r,
      settings: settings as WorkshopSettings,
    },
  }
}

export function toCertificateData(ctx: CertificateContext): CertificateData {
  const { certificate, result, settings } = ctx

  return {
    // The name frozen at completion, which is the student's EDITED profile
    // name — never the raw Google display name.
    studentName: certificate.certificate_name,
    score: result.total_score,
    total: result.total_questions,
    percentage: Number(result.percentage),
    htmlScore: result.html_score,
    cssScore: result.css_score,
    javascriptScore: result.javascript_score,
    pythonScore: result.python_score,
    certificateNumber: certificate.certificate_number,
    eventDate: new Date(settings.event_date).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    }),
    collegeName: settings.college_name,
    workshopName: settings.workshop_name,
    organizerName: settings.organizer_name,
    organizerTitle: settings.organizer_title,
  }
}

export async function renderCertificatePdf(ctx: CertificateContext): Promise<Buffer> {
  return renderToBuffer(CertificateDocument(toCertificateData(ctx)))
}

/**
 * Renders, uploads to the private bucket, and records the path.
 *
 * `markGenerated: false` is used by the send flow, which has already claimed
 * the row as 'sending' — overwriting that with 'generated' would reopen the
 * duplicate-send window the claim exists to close.
 */
export async function generateAndStore(
  ctx: CertificateContext,
  { markGenerated = true }: { markGenerated?: boolean } = {},
): Promise<{ path: string; pdf: Buffer }> {
  const admin = createAdminClient()
  const pdf = await renderCertificatePdf(ctx)
  const path = `${ctx.profile.id}/${ctx.certificate.id}.pdf`

  const { error: uploadError } = await admin.storage
    .from(CERTIFICATE_BUCKET)
    .upload(path, pdf, { contentType: "application/pdf", upsert: true })
  if (uploadError) throw uploadError

  const { error: updateError } = await admin
    .from("certificates")
    .update(
      markGenerated
        ? { file_path: path, status: "generated", last_error: null }
        : { file_path: path, last_error: null },
    )
    .eq("id", ctx.certificate.id)
  if (updateError) throw updateError

  return { path, pdf }
}

/** Short-lived signed URL. The bucket itself stays private. */
export async function signedCertificateUrl(path: string, expiresInSeconds = 60 * 60 * 24 * 7) {
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from(CERTIFICATE_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error || !data) return null
  return data.signedUrl
}
