import type { Metadata } from "next"
import { getSettings } from "@/lib/admin/queries"
import { PageHeader } from "@/components/admin/page-header"
import { SettingsForm } from "@/components/admin/settings-form"

export const metadata: Metadata = { title: "Settings" }
export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const settings = await getSettings()

  return (
    <>
      <PageHeader
        title="Settings"
        description="Event details used on certificates, and the switches that control the quiz."
      />
      <SettingsForm settings={settings} />
    </>
  )
}
