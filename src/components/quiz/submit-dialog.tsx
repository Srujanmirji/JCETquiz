"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { AlertTriangle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Final confirmation. Deliberately blunt about irreversibility, because this is
 * the one action in the app a student cannot undo. Radix handles the focus trap,
 * Escape, and the aria wiring.
 */
export function SubmitDialog({
  open,
  onOpenChange,
  onConfirm,
  submitting,
  total,
  answered,
  unanswered,
  onJumpTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  submitting: boolean
  total: number
  answered: number
  unanswered: number[]
  onJumpTo: (questionNumber: number) => void
}) {
  const hasUnanswered = unanswered.length > 0

  return (
    <Dialog.Root open={open} onOpenChange={submitting ? undefined : onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="glass-strong fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-panel)] p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]"
          onEscapeKeyDown={(e) => submitting && e.preventDefault()}
          onInteractOutside={(e) => submitting && e.preventDefault()}
        >
          <div className="flex items-start justify-between gap-4">
            <Dialog.Title className="text-lg font-semibold tracking-[-0.01em] text-ink">
              Submit your quiz?
            </Dialog.Title>
            {!submitting && (
              <Dialog.Close asChild>
                <button
                  className="-m-2.5 grid size-11 shrink-0 place-items-center rounded-[var(--radius-chip)] text-ink-faint transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            )}
          </div>

          <Dialog.Description className="mt-2 text-sm leading-relaxed text-ink-muted">
            You have answered <span className="tnum font-medium text-ink">{answered}</span> of{" "}
            <span className="tnum">{total}</span> questions. Once you submit, you cannot change your
            answers or take the quiz again.
          </Dialog.Description>

          {hasUnanswered && (
            <div className="mt-4 rounded-[var(--radius-input)] border border-warn/30 bg-warn/10 p-3.5">
              <p className="flex items-center gap-2 text-sm font-medium text-warn">
                <AlertTriangle className="size-4 shrink-0" aria-hidden />
                {unanswered.length} question{unanswered.length > 1 ? "s" : ""} still unanswered
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                Unanswered questions score zero. Tap a number to go back to it.
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {unanswered.slice(0, 12).map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      onClick={() => onJumpTo(n)}
                      className="tnum min-h-11 min-w-11 rounded-[var(--radius-chip)] border border-warn/35 px-2 text-sm font-medium text-warn transition-colors hover:bg-warn/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                    >
                      {n}
                    </button>
                  </li>
                ))}
                {unanswered.length > 12 && (
                  <li className="self-center text-xs text-ink-faint">
                    +{unanswered.length - 12} more
                  </li>
                )}
              </ul>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Keep answering
            </Button>
            <Button size="lg" onClick={onConfirm} loading={submitting} className="flex-1">
              <Send className="size-4" aria-hidden />
              Submit
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
