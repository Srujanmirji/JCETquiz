import { requireAdminApi } from "@/lib/auth/guards"
import { fail } from "@/lib/api"
import { loadCertificateContext, renderCertificatePdf } from "@/lib/certificates/generate"

/**
 * GET /api/admin/certificates/:id/preview — streams the PDF inline.
 * Renders fresh each time so a preview always reflects current settings; it
 * does not touch storage or change the certificate's status.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  const { id } = await params
  const loaded = await loadCertificateContext(id)

  if (!loaded.ok) {
    return loaded.reason === "not_eligible"
      ? fail("not_eligible", "This student is below the certificate threshold.")
      : fail("not_found", "Certificate not found.")
  }

  try {
    const pdf = await renderCertificatePdf(loaded.ctx)
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${loaded.ctx.certificate.certificate_number}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    console.error("[certificate] preview render failed", err)
    return fail("server_error", "Could not render the certificate.")
  }
}
