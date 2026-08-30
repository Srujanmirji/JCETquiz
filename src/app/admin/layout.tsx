import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { AdminSidebar } from "@/components/admin/sidebar"

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" } }

/**
 * Server-side admin guard for the admin shell. Data loaders also re-check
 * membership because App Router layouts can persist across client navigation.
 *
 * Non-admins are sent to /no-access, which deliberately lives outside /admin:
 * a child layout does not replace this one, so a denial page nested here would
 * re-enter the guard and loop.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <main id="main" className="flex-1 px-5 py-6 sm:px-7 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
