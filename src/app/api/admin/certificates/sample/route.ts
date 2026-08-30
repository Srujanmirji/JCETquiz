import { requireAdminApi } from "@/lib/auth/guards"
import { fail } from "@/lib/api"
import { renderSampleCertificate } from "@/lib/certificates/sample"

/**
 * GET /api/admin/certificates/sample
 *
 * Renders a specimen certificate from the CURRENT workshop settings, with no
 * student attached. Lets organisers check the college name, event date,
 * signature block and ID prefix before a single student has finished.
 */
export async function GET() {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  try {
    const pdf = await renderSampleCertificate()
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="certificate-sample.pdf"',
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[certificate] sample render failed", err)
    return fail("server_error", "Could not render the sample certificate.")
  }
}
