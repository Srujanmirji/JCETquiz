import { getUser } from "@/lib/auth/guards"
import { fail } from "@/lib/api"
import { loadOwnCertificate, renderCertificatePdf } from "@/lib/certificates/generate"

/**
 * GET /api/certificates/me — a student downloads their own certificate.
 *
 * Exists because the emailed copy reliably lands in spam, leaving students with
 * no way to reach a certificate they had already earned.
 *
 * The identity comes from the verified session and the lookup is keyed on
 * profile_id, so there is no id in the request to tamper with — a caller can
 * only ever receive their own. Eligibility is re-read from the stored final
 * result, and the certificate must already have been SENT by an admin, which
 * keeps issuance under admin control per docs/CERTIFICATES.md.
 */
export async function GET() {
  const user = await getUser()
  if (!user) return fail("unauthenticated", "Please sign in to continue.")

  const loaded = await loadOwnCertificate(user.id)

  if (!loaded.ok) {
    if (loaded.reason === "not_sent") {
      return fail(
        "conflict",
        "Your certificate has not been issued yet. It will be available here once the organisers send it.",
      )
    }
    if (loaded.reason === "not_eligible") {
      return fail("not_eligible", "This account is below the certificate threshold.")
    }
    return fail("not_found", "No certificate was found for this account.")
  }

  try {
    const pdf = await renderCertificatePdf(loaded.ctx)
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${loaded.ctx.certificate.certificate_number}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const message = (err as Error)?.message ?? String(err)
    console.error("[certificate] self-download failed", err)
    return fail("server_error", `Could not build your certificate: ${message}`)
  }
}

// PDF rendering needs more headroom than the default edge budget.
export const maxDuration = 60
