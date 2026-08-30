export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </header>
  )
}
