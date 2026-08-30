"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Lock, Pencil, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Field, Input, Select } from "@/components/ui/field"
import { Alert } from "@/components/ui/states"
import { BRANCHES, YEARS } from "@/lib/constants"

interface Props {
  email: string
  defaultName: string
  defaultPhone: string
  defaultBranch: string
  defaultYear: string
  lockYear: boolean
  isUpdate: boolean
}

export function RegistrationForm({
  email,
  defaultName,
  defaultPhone,
  defaultBranch,
  defaultYear,
  lockYear,
  isUpdate,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || pending) return

    setSubmitting(true)
    setErrors({})
    setFormError(null)

    const form = new FormData(event.currentTarget)
    const body = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      branch: String(form.get("branch") ?? ""),
      year: lockYear ? "1st Year" : String(form.get("year") ?? "1st Year"),
    }

    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        setErrors(json?.error?.fields ?? {})
        setFormError(json?.error?.fields ? null : (json?.error?.message ?? "Could not save your details."))
        setSubmitting(false)
        return
      }

      startTransition(() => router.push("/quiz"))
    } catch {
      setFormError("We could not reach the server. Check your connection and try again.")
      setSubmitting(false)
    }
  }

  const busy = submitting || pending

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {formError && <Alert>{formError}</Alert>}

      <Field label="Full Name" htmlFor="name" required error={errors["name"]}>
        <div className="relative">
          <Input
            id="name"
            name="name"
            defaultValue={defaultName}
            autoComplete="name"
            maxLength={80}
            required
            error={errors["name"]}
            placeholder="e.g. Srujan Mirji"
            className="pr-10"
          />
          <Pencil
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-accent/70"
            aria-hidden
          />
        </div>
      </Field>

      <Field label="Email" htmlFor="email">
        <div className="relative">
          <Input
            id="email"
            name="email"
            value={email}
            readOnly
            disabled
            aria-describedby="email-locked"
            className="pr-10"
          />
          <Lock
            className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
            aria-hidden
          />
        </div>
      </Field>

      <Field label="Mobile Number" htmlFor="phone" required error={errors["phone"]}
        hint="10 digits, no country code.">
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          pattern="[6-9][0-9]{9}"
          defaultValue={defaultPhone}
          required
          error={errors["phone"]}
          placeholder="9876543210"
        />
      </Field>

      <Field label="Branch" htmlFor="branch" required error={errors["branch"]}>
        <Select id="branch" name="branch" defaultValue={defaultBranch} required error={errors["branch"]}>
          <option value="" disabled>
            Select your branch
          </option>
          {BRANCHES.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Year" htmlFor="year" error={errors["year"]}>
        {lockYear ? (
          <Input id="year" name="year" value="1st Year" readOnly disabled />
        ) : (
          <Select id="year" name="year" defaultValue={defaultYear} error={errors["year"]}>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className="pt-2">
        <Button type="submit" size="lg" block loading={busy}>
          {isUpdate ? "Save and Continue" : "Continue to Quiz"}
          {!busy && <ArrowRight className="size-4" aria-hidden />}
        </Button>
      </div>

      <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-xs text-ink-faint">
        <ShieldCheck className="size-3.5 text-accent" aria-hidden />
        <span>Your information is safe with us.</span>
      </p>
    </form>
  )
}
