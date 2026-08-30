import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"
import { createAdminClient } from "@/lib/supabase/admin"
import { CertificateDocument } from "@/lib/certificates/template"
import { TOTAL_QUESTIONS } from "@/lib/constants"
import type { WorkshopSettings } from "@/types/database"

const FALLBACK: WorkshopSettings = {
  id: true,
  college_name: "Your College Name",
  workshop_name: "Web Development Workshop",
  event_date: new Date().toISOString().slice(0, 10),
  organizer_name: "Workshop Organizer",
  organizer_title: "Faculty Coordinator",
  certificate_prefix: "WDW",
  quiz_open: true,
  randomize_questions: false,
  lock_year: true,
  updated_at: new Date().toISOString(),
}

/** A specimen certificate using current settings and a placeholder student. */
export async function renderSampleCertificate(): Promise<Buffer> {
  let settings = FALLBACK
  try {
    const { data } = await createAdminClient().from("workshop_settings").select("*").single()
    if (data) settings = data as WorkshopSettings
  } catch {
    // Fall back to defaults so the template can still be reviewed before setup.
  }

  return renderToBuffer(
    CertificateDocument({
      studentName: "Ananya Sharma",
      score: 32,
      total: TOTAL_QUESTIONS,
      percentage: 80,
      htmlScore: 9,
      cssScore: 8,
      javascriptScore: 7,
      pythonScore: 8,
      certificateNumber: `${settings.certificate_prefix}-${new Date().getFullYear()}-00042`,
      eventDate: new Date(settings.event_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      collegeName: settings.college_name,
      workshopName: settings.workshop_name,
      organizerName: settings.organizer_name,
      organizerTitle: settings.organizer_title,
    }),
  )
}
