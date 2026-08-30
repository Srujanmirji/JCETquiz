"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const button = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-medium select-none",
    "transition-[background-color,border-color,color,transform,box-shadow] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-45",
    "active:translate-y-px",
  ],
  {
    variants: {
      variant: {
        // The one place accent appears as a fill. Everything else is quiet.
        primary:
          "bg-accent text-on-accent hover:bg-accent-soft shadow-button",
        secondary:
          "bg-glass-strong text-ink border border-line-strong hover:bg-glass-hover backdrop-blur-xl",
        ghost: "text-ink-muted hover:text-ink hover:bg-glass",
        danger: "bg-bad/15 text-bad border border-bad/35 hover:bg-bad/25",
        outline: "border border-line-strong text-ink hover:bg-glass",
      },
      size: {
        sm: "h-11 px-3.5 text-sm rounded-[var(--radius-chip)]",
        md: "h-11 px-5 text-sm rounded-[var(--radius-input)]",
        lg: "h-13 px-7 text-base rounded-[var(--radius-input)]",
        icon: "h-11 w-11 rounded-[var(--radius-input)]",
      },
      block: { true: "w-full", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", block: false },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(button({ variant, size, block }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            <span>Working…</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  },
)
Button.displayName = "Button"
