"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, FileText } from "lucide-react"
import type { WorkshopSettings } from "@/types/database"
import { DataSurface } from "@/components/ui/surface"
import { Button } from "@/components/ui/button"
import { Field, Input } from "@/components/ui/field"
import { Alert } from "@/components/ui/states"
import { Toggle } from "@/components/ui/toggle"

export function SettingsForm({ settings }: { settings: WorkshopSettings }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [quizOpen, setQuizOpen] = useState(settings.quiz_open)
  const [randomize, setRandomize] = useState(settings.randomize_questions)
  const [lockYear, setLockYear] = useState(settings.lock_year)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setErrors({})
    setFormError(null)
    setSaved(false)

    const form = new FormData(e.currentTarget)
    const body = {
      college_name: String(form.get("college_name") ?? ""),
      workshop_name: String(form.get("workshop_name") ?? ""),
      event_date: String(form.get("event_date") ?? ""),
      organizer_name: String(form.get("organizer_name") ?? ""),
      organizer_title: String(form.get("organizer_title") ?? ""),
      certificate_prefix: String(form.get("certificate_prefix") ?? "").toUpperCase(),
      quiz_open: quizOpen,
      randomize_questions: randomize,
      lock_year: lockYear,
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (res.ok) {
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 3000)
      } else {
        setErrors(json?.error?.fields ?? {})
        setFormError(json?.error?.fields ? null : (json?.error?.message ?? "Could not save."))
      }
    } catch {
      setFormError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-2xl space-y-4">
      {formError && <Alert>{formError}</Alert>}

      <DataSurface className="p-5">
        <h2 className="text-sm font-medium text-ink">Event details</h2>
        <p className="mt-1 text-xs text-ink-faint">
          These values are printed on every certificate.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="College name" htmlFor="college_name" required error={errors["college_name"]}>
            <Input id="college_name" name="college_name" defaultValue={settings.college_name} required error={errors["college_name"]} />
          </Field>

          <Field label="Workshop name" htmlFor="workshop_name" required error={errors["workshop_name"]}>
            <Input id="workshop_name" name="workshop_name" defaultValue={settings.workshop_name} required error={errors["workshop_name"]} />
          </Field>

          <Field label="Event date" htmlFor="event_date" required error={errors["event_date"]}>
            <Input id="event_date" name="event_date" type="date" defaultValue={settings.event_date} required error={errors["event_date"]} />
          </Field>

          <Field
            label="Certificate ID prefix"
            htmlFor="certificate_prefix"
            required
            hint="Uppercase, 2–8 characters. Used as WDW-2026-00123."
            error={errors["certificate_prefix"]}
          >
            <Input
              id="certificate_prefix"
              name="certificate_prefix"
              defaultValue={settings.certificate_prefix}
              maxLength={8}
              required
              className="font-mono uppercase"
              error={errors["certificate_prefix"]}
            />
          </Field>

          <Field label="Organiser name" htmlFor="organizer_name" required error={errors["organizer_name"]}>
            <Input id="organizer_name" name="organizer_name" defaultValue={settings.organizer_name} required error={errors["organizer_name"]} />
          </Field>

          <Field label="Organiser title" htmlFor="organizer_title" required error={errors["organizer_title"]}>
            <Input id="organizer_title" name="organizer_title" defaultValue={settings.organizer_title} required error={errors["organizer_title"]} />
          </Field>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <Button asChild variant="secondary" size="sm">
            <a href="/api/admin/certificates/sample" target="_blank" rel="noopener noreferrer">
              <FileText className="size-4" aria-hidden />
              Preview a sample certificate
            </a>
          </Button>
          <p className="mt-2 text-xs text-ink-faint">
            Opens a specimen using these saved values. Check the spelling before the event —
            save first, since the preview reads what is stored.
          </p>
        </div>
      </DataSurface>

      <DataSurface className="divide-y divide-line p-0">
        <div className="p-5">
          <h2 className="text-sm font-medium text-ink">Quiz controls</h2>
        </div>

        <Toggle
          id="quiz_open"
          label="Quiz is open"
          description="Turn this off outside the session. Students who have already submitted still see their result."
          checked={quizOpen}
          onChange={setQuizOpen}
        />

        <Toggle
          id="randomize_questions"
          label="Randomise question order"
          description="Each student gets a fixed shuffled order, the same on every device and after a refresh. Off by default."
          checked={randomize}
          onChange={setRandomize}
        />

        <Toggle
          id="lock_year"
          label="Lock year to 1st Year"
          description="Turn off if students from other years are attending."
          checked={lockYear}
          onChange={setLockYear}
        />
      </DataSurface>

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" loading={saving}>
          Save settings
        </Button>
        {saved && (
          <p role="status" className="flex items-center gap-1.5 text-sm text-ok">
            <Check className="size-4" aria-hidden />
            Saved
          </p>
        )}
      </div>
    </form>
  )
}
