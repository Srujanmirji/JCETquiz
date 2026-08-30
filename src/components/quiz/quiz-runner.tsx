"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import type { PublicQuestion } from "@/types/database"
import { draftKey, type QuizSlug } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/surface"
import { Badge } from "@/components/ui/badge"
import { Alert } from "@/components/ui/states"
import { QuizProgress } from "@/components/quiz/progress"
import { OptionButton } from "@/components/quiz/option-button"
import { SubmitDialog } from "@/components/quiz/submit-dialog"
import { Logo } from "@/components/marketing/logo"
import { cn, initials } from "@/lib/utils"

type Answers = Record<string, number>

interface Draft {
  answers: Answers
  index: number
}

/**
 * The quiz runner.
 *
 * State model: answers live in React state and are mirrored to localStorage on
 * every change. That draft is a convenience only — it survives a refresh or a
 * dead battery — and is never authoritative. The score comes from the server,
 * which regrades from its own answer key regardless of what this component
 * believes (docs/SECURITY.md).
 */
export function QuizRunner({
  slug,
  quizTitle,
  quizSubtitle,
  questions,
  studentName,
  workshopName,
}: {
  slug: QuizSlug
  quizTitle: string
  quizSubtitle: string | null
  questions: PublicQuestion[]
  studentName: string
  workshopName: string
}) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [hydrated, setHydrated] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guards against a double submit from a fast double-tap, which React state
  // alone would not catch inside the same tick.
  const submitLock = useRef(false)
  const questionRef = useRef<HTMLDivElement>(null)

  const total = questions.length
  const question = questions[index]
  const answeredCount = Object.keys(answers).length
  const isLast = index === total - 1

  const unanswered = useMemo(
    () => questions.filter((q) => answers[q.id] === undefined).map((q, i) => ({ q, i })),
    [questions, answers],
  )

  // ---- draft restore (once, on mount) ----
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey(slug))
      if (raw) {
        const draft = JSON.parse(raw) as Draft
        const valid = new Set(questions.map((q) => q.id))
        const restored: Answers = {}
        for (const [id, opt] of Object.entries(draft.answers ?? {})) {
          if (valid.has(id) && Number.isInteger(opt) && opt >= 0 && opt <= 3) restored[id] = opt
        }
        setAnswers(restored)
        if (Number.isInteger(draft.index) && draft.index >= 0 && draft.index < total) {
          setIndex(draft.index)
        }
      }
    } catch {
      // A corrupt draft is not worth a crash; start clean.
    }
    setHydrated(true)
  }, [questions, total])

  // ---- draft persist ----
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(draftKey(slug), JSON.stringify({ answers, index } satisfies Draft))
    } catch {
      // Private mode / quota. The quiz still works, it just will not resume.
    }
  }, [answers, index, hydrated])

  // ---- warn before an accidental tab close mid-quiz ----
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (answeredCount > 0 && !submitLock.current) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [answeredCount])

  const goTo = useCallback(
    (next: number) => {
      setIndex((prev) => {
        const clamped = Math.max(0, Math.min(total - 1, next))
        if (clamped !== prev) {
          // Move focus to the new question so keyboard and screen-reader users
          // are not left at the bottom of the page.
          requestAnimationFrame(() => questionRef.current?.focus())
        }
        return clamped
      })
    },
    [total],
  )

  const select = useCallback(
    (optionIndex: number) => {
      if (!question) return
      setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))
    },
    [question],
  )

  // ---- keyboard: 1–4 to answer, arrows to navigate ----
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (dialogOpen || submitting) return
      const target = e.target as HTMLElement | null
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return

      if (e.key >= "1" && e.key <= "4") {
        e.preventDefault()
        select(Number(e.key) - 1)
      } else if (e.key === "ArrowRight" && !isLast) {
        e.preventDefault()
        goTo(index + 1)
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault()
        goTo(index - 1)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [dialogOpen, submitting, isLast, index, goTo, select])

  async function submit() {
    if (submitLock.current) return
    submitLock.current = true
    setSubmitting(true)
    setError(null)

    const payload = {
      answers: questions.map((q) => ({
        questionId: q.id,
        selectedOption: answers[q.id] ?? null,
      })),
    }

    try {
      const res = await fetch(`/api/quiz/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      // A 409 "already_completed" is a success from the student's point of
      // view — their result exists, so show it rather than an error.
      if (res.ok || json?.error?.code === "already_completed") {
        try {
          window.localStorage.removeItem(draftKey(slug))
        } catch {
          /* ignore */
        }
        router.replace(`/result/${slug}`)
        return
      }

      setError(json?.error?.message ?? "We could not submit your quiz. Please try again.")
      setDialogOpen(false)
      submitLock.current = false
      setSubmitting(false)
    } catch {
      setError(
        "We could not reach the server. Your answers are saved on this device — check your connection and submit again.",
      )
      setDialogOpen(false)
      submitLock.current = false
      setSubmitting(false)
    }
  }

  if (!question) return null

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---- header: workshop + student ---- */}
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/40 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo size={26} />
            <span className="truncate text-sm font-semibold tracking-tight text-ink">
              {workshopName}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="hidden text-sm text-ink-muted sm:inline">{studentName}</span>
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-full border border-line bg-glass text-xs font-semibold text-ink-muted"
            >
              {initials(studentName)}
            </span>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:py-10">
        <div className="space-y-6">
          <QuizProgress current={index + 1} total={total} answered={answeredCount} />

          {error && <Alert>{error}</Alert>}

          <div className="grid items-start gap-5 lg:grid-cols-[220px_1fr]">
            {/* Question map for THIS quiz. The old rail listed HTML/CSS/JS,
                which is meaningless now that a quiz covers a single topic. */}
            <Panel className="hidden p-5 lg:block">
              <h2 className="text-sm font-medium text-ink">{quizTitle}</h2>
              <p className="mt-1 text-xs text-ink-faint">{quizSubtitle}</p>

              <ul className="mt-5 grid grid-cols-5 gap-1.5">
                {questions.map((q, i) => {
                  const answered = answers[q.id] !== undefined
                  const current = i === index
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => goTo(i)}
                        aria-label={`Question ${i + 1}${answered ? ", answered" : ", not answered"}`}
                        aria-current={current ? "true" : undefined}
                        className={cn(
                          "tnum grid size-9 place-items-center rounded-[var(--radius-chip)] border text-xs font-medium transition-colors",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                          current
                            ? "border-accent bg-accent text-on-accent"
                            : answered
                              ? "border-ok/40 bg-ok/12 text-ok"
                              : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
                        )}
                      >
                        {i + 1}
                      </button>
                    </li>
                  )
                })}
              </ul>

              <p className="mt-5 border-t border-line pt-4 text-xs text-ink-faint">
                <span className="tnum text-ink">{answeredCount}</span> of{" "}
                <span className="tnum">{total}</span> answered
              </p>
            </Panel>

            <div className="space-y-4">
              <Panel className="p-6 sm:p-8">
                <div
                  ref={questionRef}
                  tabIndex={-1}
                  aria-labelledby="question-text"
                  className="outline-none"
                >
                  <Badge tone="orange">{quizTitle}</Badge>

                  <h1
                    id="question-text"
                    className="mt-4 text-xl font-semibold leading-snug tracking-[-0.01em] text-ink sm:text-2xl"
                  >
                    {question.question_text}
                  </h1>

                  <div
                    role="radiogroup"
                    aria-labelledby="question-text"
                    className="mt-6 grid gap-2.5"
                  >
                    {question.options.map((option, i) => (
                      <OptionButton
                        key={`${question.id}-${i}`}
                        index={i}
                        label={option}
                        selected={answers[question.id] === i}
                        onSelect={() => select(i)}
                        questionId={question.id}
                      />
                    ))}
                  </div>
                </div>
              </Panel>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => goTo(index - 1)}
                  disabled={index === 0}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowLeft className="size-4" aria-hidden />
                  Previous
                </Button>

                {isLast ? (
                  <Button size="lg" onClick={() => setDialogOpen(true)} className="flex-1">
                    <Send className="size-4" aria-hidden />
                    Submit quiz
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => goTo(index + 1)} className="flex-1">
                    Next
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Hidden on touch, where there is no keyboard to reference. */}
          <p className="hidden text-center text-xs text-ink-faint sm:block">
            Press <kbd className="font-mono text-ink-muted">1</kbd>–
            <kbd className="font-mono text-ink-muted">4</kbd> to answer, arrow keys to move between
            questions.
          </p>
        </div>
      </main>

      <SubmitDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={submit}
        submitting={submitting}
        total={total}
        answered={answeredCount}
        unanswered={unanswered.map(({ i }) => i + 1)}
        onJumpTo={(questionNumber) => {
          setDialogOpen(false)
          goTo(questionNumber - 1)
        }}
      />
    </div>
  )
}
