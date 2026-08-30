"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Check, Lock, Plus, X } from "lucide-react"
import type { AdminQuestion, Quiz } from "@/types/database"
import { DataSurface } from "@/components/ui/surface"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/field"
import { Alert } from "@/components/ui/states"
import { QuestionEditor } from "@/components/admin/question-editor"


const LETTERS = ["A", "B", "C", "D"] as const

export function QuestionManager({
  questions,
  quizzes,
  lockedIds,
  activeQuiz,
}: {
  questions: AdminQuestion[]
  quizzes: Quiz[]
  lockedIds: string[]
  activeQuiz: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const locked = new Set(lockedIds)

  const [editing, setEditing] = useState<AdminQuestion | "new" | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleActive(q: AdminQuestion) {
    setBusyId(q.id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !q.is_active }),
      })
      if (!res.ok) {
        const json = await res.json()
        setError(json?.error?.message ?? "Could not update the question.")
      } else {
        router.refresh()
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="w-full sm:w-52">
          <label htmlFor="filter-quiz" className="sr-only">
            Filter by quiz
          </label>
          <Select
            id="filter-quiz"
            value={activeQuiz}
            onChange={(e) => {
              const q = new URLSearchParams(params.toString())
              if (e.target.value) q.set("quiz", e.target.value)
              else q.delete("quiz")
              router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false })
            }}
          >
            <option value="">All quizzes</option>
            {quizzes.map((z) => (
              <option key={z.slug} value={z.slug}>
                {z.title}
              </option>
            ))}
          </Select>
        </div>

        <Button size="md" onClick={() => setEditing("new")} className="sm:ml-auto">
          <Plus className="size-4" aria-hidden />
          Add question
        </Button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <ul className="space-y-2.5">
        {questions.map((q, i) => {
          const isLocked = locked.has(q.id)
          return (
            <li key={q.id}>
              <DataSurface className={q.is_active ? "p-4" : "p-4 opacity-60"}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 font-mono text-xs tabular-nums text-ink-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug text-ink">{q.question_text}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone="info">
                          {quizzes.find((z) => z.id === q.quiz_id)?.title ?? "Quiz"}
                        </Badge>
                        {!q.is_active && <Badge>Disabled</Badge>}
                        {isLocked && (
                          <Badge tone="warn">
                            <Lock className="size-3" aria-hidden />
                            Graded — locked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(q)}
                      disabled={busyId === q.id}
                    >
                      {isLocked ? "View" : "Edit"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(q)}
                      loading={busyId === q.id}
                    >
                      {q.is_active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>

                <ol className="mt-3 grid gap-1.5 border-t border-line pt-3 sm:grid-cols-2">
                  {q.options.map((opt, oi) => {
                    const correct = oi === q.correct_option
                    return (
                      <li
                        key={oi}
                        className={`flex items-center gap-2 text-xs ${correct ? "text-ok" : "text-ink-muted"}`}
                      >
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded border text-2xs font-semibold ${
                            correct ? "border-ok/40 bg-ok/10" : "border-line"
                          }`}
                        >
                          {correct ? <Check className="size-3" strokeWidth={3} /> : LETTERS[oi]}
                        </span>
                        <span className="truncate">{opt}</span>
                      </li>
                    )
                  })}
                </ol>

                {q.explanation && (
                  <p className="mt-2.5 border-t border-line pt-2.5 text-xs leading-relaxed text-ink-faint">
                    {q.explanation}
                  </p>
                )}
              </DataSurface>
            </li>
          )
        })}
      </ul>

      {editing && (
        <QuestionEditor
          quizzes={quizzes}
          question={editing === "new" ? null : editing}
          locked={editing !== "new" && locked.has(editing.id)}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
