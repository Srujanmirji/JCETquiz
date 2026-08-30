"use client"

import * as Switch from "@radix-ui/react-switch"

export function Toggle({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-5 p-5">
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink">
          {label}
        </label>
        {description && (
          <p id={`${id}-desc`} className="mt-1 max-w-[52ch] text-xs leading-relaxed text-ink-faint">
            {description}
          </p>
        )}
      </div>

      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={description ? `${id}-desc` : undefined}
        className="relative h-6 w-11 shrink-0 rounded-full border border-line bg-[rgba(255,255,255,0.08)] transition-colors duration-150 data-[state=checked]:border-accent data-[state=checked]:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Switch.Thumb className="block size-4 translate-x-1 rounded-full bg-ink-muted transition-transform duration-150 will-change-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-white" />
      </Switch.Root>
    </div>
  )
}
