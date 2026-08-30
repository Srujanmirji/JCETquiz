import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/surface"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <Panel className="w-full max-w-md p-8 text-center">
        <p className="font-mono text-sm text-ink-faint">404</p>
        <h1 className="mt-2 text-xl font-semibold tracking-[-0.01em] text-ink">Page not found</h1>
        <p className="mx-auto mt-2 max-w-[38ch] text-sm leading-relaxed text-ink-muted">
          That page does not exist. Head back and we will take you to the right place.
        </p>
        <Button asChild className="mt-6">
          <Link href="/continue">Take me back</Link>
        </Button>
      </Panel>
    </div>
  )
}
