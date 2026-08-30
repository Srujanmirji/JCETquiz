import { Skeleton } from "@/components/ui/states"

export default function AdminLoading() {
  return (
    <>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-[var(--radius-card)]" />
        ))}
      </div>
      <Skeleton className="mt-8 h-64 w-full rounded-[var(--radius-card)]" />
    </>
  )
}
