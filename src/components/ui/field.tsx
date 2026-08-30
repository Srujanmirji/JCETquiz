"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Every control gets a real <label>, and every error is wired through
 * aria-describedby + aria-invalid so screen readers announce it.
 */

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  const errorId = `${htmlFor}-error`
  const hintId = `${htmlFor}-hint`

  return (
    <div className={cn("space-y-2", className)}>
      <LabelPrimitive.Root
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-sm font-medium text-ink"
      >
        {label}
        {required && (
          <span className="text-accent" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only">(required)</span>}
      </LabelPrimitive.Root>

      {children}

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-bad" role="alert">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Controls sit ON glass, so they have to read as recessed wells rather than as
 * more glass. A dark fill plus an inset top shadow does that; a translucent
 * white fill would disappear into the panel behind it.
 */
const controlBase = [
  "w-full rounded-[var(--radius-input)] border px-3.5 text-sm text-ink",
  "border-line bg-[rgba(8,10,20,0.55)]",
  "shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.45)]",
  "placeholder:text-ink-faint",
  "transition-[border-color,background-color,box-shadow] duration-150",
  "hover:border-line-strong",
  "focus:border-accent focus:bg-[rgba(8,10,20,0.75)]",
  "focus:shadow-[inset_0_1px_2px_0_rgba(0,0,0,0.45),0_0_0_3px_rgba(245,79,27,0.20)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
  "disabled:cursor-not-allowed disabled:border-line/60 disabled:bg-[rgba(8,10,20,0.25)] disabled:text-ink-faint",
  "aria-[invalid=true]:border-bad",
].join(" ")

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { error?: string }
>(({ className, error, id, ...props }, ref) => (
  <input
    ref={ref}
    id={id}
    className={cn(controlBase, "h-11", className)}
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? `${id}-error` : undefined}
    {...props}
  />
))
Input.displayName = "Input"

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }
>(({ className, error, id, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      id={id}
      className={cn(
        controlBase,
        "h-11 appearance-none pr-10",
        // The native option list is unstyleable; give it a readable dark ground.
        "[&>option]:bg-[#12162b] [&>option]:text-ink",
        className,
      )}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    >
      {children}
    </select>
    <svg
      className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </div>
))
Select.displayName = "Select"

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }
>(({ className, error, id, ...props }, ref) => (
  <textarea
    ref={ref}
    id={id}
    className={cn(controlBase, "min-h-24 py-2.5 leading-relaxed", className)}
    aria-invalid={error ? true : undefined}
    aria-describedby={error ? `${id}-error` : undefined}
    {...props}
  />
))
Textarea.displayName = "Textarea"
