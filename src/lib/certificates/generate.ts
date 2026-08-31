import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"
import { createAdminClient } from "@/lib/supabase/admin"
import { CertificateDocument, type CertificateData } from "@/lib/certificates/template"
import { formatEventDate } from "@/lib/certificates/event-date"
import { clubLogoPath } from "@/lib/certificates/logo"
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

/**
 * Loads a student's OWN certificate for self-service download.
 *
 * Keyed on profile_id rather than certificate id, so a caller can only ever
 * reach their own — there is no id to tamper with. Requires the admin to have
 * already SENT it: docs/CERTIFICATES.md puts issuance under admin control, and
 * this is retrieval of something already issued, not self-issuing.
 */
export async function loadOwnCertificate(
  profileId: string,
): Promise<
  | { ok: true; ctx: CertificateContext }
  | { ok: false; reason: "none" | "not_sent" | "not_eligible" }
> {
  const admin = createAdminClient()

  const { data: cert } = await admin
    .from("certificates").select("*").eq("profile_id", profileId).maybeSingle()
  if (!cert) return { ok: false, reason: "none" }
  const certificate = cert as Certificate

  if (certificate.status !== "sent") return { ok: false, reason: "not_sent" }

  const [{ data: profile }, { data: result }, { data: settings }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    admin.from("final_results").select("*").eq("id", certificate.final_result_id).maybeSingle(),
    admin.from("workshop_settings").select("*").single(),
  ])

  if (!profile || !result || !settings) return { ok: false, reason: "none" }

  // Re-verified from the stored result, never from a client-supplied flag.
  const r = result as FinalResult
  if (!r.certificate_eligible) return { ok: false, reason: "not_eligible" }

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
    eventDate: formatEventDate(settings.event_date, settings.event_end_date),
    logoPath: clubLogoPath(),
    clubName: settings.club_name,
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
