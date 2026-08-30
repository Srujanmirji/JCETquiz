"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select } from "@/components/ui/field"

export function CertificateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  return (
    <div className="w-full sm:w-52">
      <label htmlFor="cert-status" className="sr-only">
        Filter by certificate status
      </label>
      <Select
        id="cert-status"
        value={params.get("status") ?? "all"}
        onChange={(e) => {
          const q = new URLSearchParams()
          if (e.target.value !== "all") q.set("status", e.target.value)
          router.replace(q.toString() ? `${pathname}?${q}` : pathname, { scroll: false })
        }}
      >
        <option value="all">All certificates</option>
        <option value="eligible">Awaiting send</option>
        <option value="generated">Ready to send</option>
        <option value="sent">Sent</option>
        <option value="failed">Failed</option>
      </Select>
    </div>
  )
}
