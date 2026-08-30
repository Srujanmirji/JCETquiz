import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"
import { createAdminClient } from "@/lib/supabase/admin"
import { CertificateDocument } from "@/lib/certificates/template"
import { formatEventDate } from "@/lib/certificates/event-date"
import { clubLogoPath } from "@/lib/certificates/logo"
import { TOTAL_QUESTIONS } from "@/lib/constants"
import type { WorkshopSettings } from "@/types/database"

const FALLBACK: WorkshopSettings = {
  id: true,
  club_name: "Developer's Club",
  college_name: "Jain College of Engineering and Technology, Hubli",
  workshop_name: "Web Development Workshop",
  event_date: new Date().toISOString().slice(0, 10),
  event_end_date: null,
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
      eventDate: formatEventDate(settings.event_date, settings.event_end_date),
      logoPath: clubLogoPath(),
    clubName: settings.club_name,
      collegeName: settings.college_name,
      workshopName: settings.workshop_name,
      organizerName: settings.organizer_name,
      organizerTitle: settings.organizer_title,
    }),
  )
}
