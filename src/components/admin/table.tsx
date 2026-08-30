import { cn } from "@/lib/utils"

/**
 * Admin tables are opaque and unblurred (docs/UI-DESIGN.md). On narrow screens
 * the table scrolls inside its own container so the page body never scrolls
 * sideways; card-per-row variants are used where the columns are too many.
 */
export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-[var(--radius-card)] border border-line bg-elevated",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return <table className={cn("w-full min-w-[720px] border-collapse text-sm", className)}>{children}</table>
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode
  className?: string
  align?: "left" | "right" | "center"
}) {
  return (
    <th
      scope="col"
      className={cn(
        "whitespace-nowrap border-b border-line px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode
  className?: string
  align?: "left" | "right" | "center"
}) {
  return (
    <td
      className={cn(
        "border-b border-line/60 px-4 py-3 text-ink-muted",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  )
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn("transition-colors duration-100 hover:bg-[rgba(255,255,255,0.035)]", className)}>
      {children}
    </tr>
  )
}
