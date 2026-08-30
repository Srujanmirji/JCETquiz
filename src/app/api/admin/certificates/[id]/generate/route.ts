import { requireAdminApi } from "@/lib/auth/guards"
import { ok, fail } from "@/lib/api"
import { createAdminClient } from "@/lib/supabase/admin"
import { loadCertificateContext, generateAndStore } from "@/lib/certificates/generate"

/** POST /api/admin/certificates/:id/generate — render and store the PDF. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminApi())) return fail("forbidden", "Admin access required.")

  const { id } = await params
  const loaded = await loadCertificateContext(id)

  if (!loaded.ok) {
    return loaded.reason === "not_eligible"
      ? fail("not_eligible", "This student is below the certificate threshold.")
      : fail("not_found", "Certificate not found.")
  }

  try {
    const { path } = await generateAndStore(loaded.ctx)
    return ok({ filePath: path, status: "generated" })
  } catch (err) {
    console.error("[certificate] generate failed", err)
    const { error: auditError } = await createAdminClient()
      .from("certificates")
      .update({ status: "failed", last_error: describe(err) })
      .eq("id", id)
    if (auditError) console.error("[certificate] failed-generation audit update failed", auditError)
    return fail("server_error", "Could not generate the certificate. Please try again.")
  }
}

function describe(err: unknown) {
  return (err as { message?: string })?.message?.slice(0, 300) ?? "Unknown error"
}
