"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Lock, X } from "lucide-react"
import type { AdminQuestion, Quiz } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Field, Input, Select, Textarea } from "@/components/ui/field"
import { Alert } from "@/components/ui/states"


const LETTERS = ["A", "B", "C", "D"] as const

/**
 * Add / edit a question.
 *
 * When `locked` (the question has been graded), the wording, options and answer
 * key render read-only and only the explanation and active state are
 * submittable — matching what the API and the database trigger allow.
 */
export function QuestionEditor({
  quizzes,
  question,
  locked,
  onClose,
  onSaved,
}: {
  quizzes: Quiz[]
  question: AdminQuestion | null
  locked: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [correct, setCorrect] = useState(question?.correct_option ?? 0)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setErrors({})
    setFormError(null)

    const form = new FormData(e.currentTarget)

    const body = locked
      ? { explanation: String(form.get("explanation") ?? "") || null }
      : {
          quiz_id: String(form.get("quiz_id") ?? quizzes[0]?.id ?? ""),
          question_text: String(form.get("question_text") ?? ""),
          options: [0, 1, 2, 3].map((i) => String(form.get(`option-${i}`) ?? "")),
          correct_option: correct,
          explanation: String(form.get("explanation") ?? "") || null,
          is_active: question?.is_active ?? true,
        }

    try {
      const res = await fetch(
        question ? `/api/admin/questions/${question.id}` : "/api/admin/questions",
        {
          method: question ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      const json = await res.json()

      if (res.ok) {
        onSaved()
        return
      }
      setErrors(json?.error?.fields ?? {})
      setFormError(json?.error?.fields ? null : (json?.error?.message ?? "Could not save."))
    } catch {
      setFormError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(o) => !o && !saving && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius-panel)] border border-line bg-elevated p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]">
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold tracking-[-0.01em] text-ink">
              {question ? (locked ? "Question (locked)" : "Edit question") : "Add question"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="-m-2.5 grid size-11 shrink-0 place-items-center rounded-[var(--radius-chip)] text-ink-faint hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          {locked && (
            <div className="mt-4">
              <Alert tone="info">
                This question has been answered in a graded attempt. Its wording, options and
                answer key are locked so completed results stay meaningful. You can still edit the
                explanation.
              </Alert>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
            {formError && <Alert>{formError}</Alert>}

            <Field label="Quiz" htmlFor="quiz_id" required error={errors["quiz_id"]}>
              <Select
                id="quiz_id"
                name="quiz_id"
                defaultValue={question?.quiz_id ?? quizzes[0]?.id}
                disabled={locked}
                error={errors["quiz_id"]}
              >
                {quizzes.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.title}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Question"
              htmlFor="question_text"
              required
              error={errors["question_text"]}
            >
              <Textarea
                id="question_text"
                name="question_text"
                defaultValue={question?.question_text ?? ""}
                disabled={locked}
                maxLength={500}
                error={errors["question_text"]}
                placeholder="What does HTML stand for?"
              />
            </Field>

            <fieldset className="space-y-2.5" disabled={locked}>
              <legend className="mb-2 text-sm font-medium text-ink">
                Options — select the correct one
              </legend>
              {errors["options"] && (
                <p className="text-xs text-bad" role="alert">
                  {errors["options"]}
                </p>
              )}

              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <label className="flex shrink-0 cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="correct_option"
                      value={i}
                      checked={correct === i}
                      onChange={() => setCorrect(i)}
                      disabled={locked}
                      className="size-4 accent-[#34d399]"
                    />
                    <span className="sr-only">Option {LETTERS[i]} is correct</span>
                    <span
                      aria-hidden
                      className="grid size-7 place-items-center rounded-[var(--radius-chip)] border border-line text-xs font-semibold text-ink-muted"
                    >
                      {LETTERS[i]}
                    </span>
                  </label>
                  <Input
                    id={`option-${i}`}
                    name={`option-${i}`}
                    defaultValue={question?.options[i] ?? ""}
                    disabled={locked}
                    maxLength={200}
                    placeholder={`Option ${LETTERS[i]}`}
                    required
                  />
                </div>
              ))}
            </fieldset>

            <Field
              label="Explanation"
              htmlFor="explanation"
              hint="Shown to admins only. Never sent to students."
              error={errors["explanation"]}
            >
              <Textarea
                id="explanation"
                name="explanation"
                defaultValue={question?.explanation ?? ""}
                maxLength={500}
                error={errors["explanation"]}
              />
            </Field>

            <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={onClose}
                disabled={saving}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" size="lg" loading={saving} className="flex-1">
                {locked ? (
                  <>
                    <Lock className="size-4" aria-hidden />
                    Save explanation
                  </>
                ) : question ? (
                  "Save changes"
                ) : (
                  "Add question"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
