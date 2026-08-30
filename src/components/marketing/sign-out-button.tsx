"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={async () => {
        setPending(true)
        await createClient().auth.signOut()
        router.push("/")
        router.refresh()
      }}
    >
      <LogOut className="size-4" aria-hidden />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  )
}
