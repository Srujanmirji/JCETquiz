import Link from "next/link"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Logo } from "@/components/marketing/logo"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/surface"
import { HeroVisual } from "@/components/marketing/hero-visual"
import { createClient } from "@/lib/supabase/server"
import { TOTAL_QUESTIONS, PASS_PERCENTAGE, QUIZZES } from "@/lib/constants"

const HIGHLIGHTS = [
  `${TOTAL_QUESTIONS} Beginner Friendly Questions`,
  "HTML, CSS, JavaScript & Python",
  `Certificate for ${PASS_PERCENTAGE}% & Above`,
] as const

// Every value here is a short numeral so the row reads as one set of stats.
// A word in this slot ("Certificate") overflowed the card at every width.
const METRICS = [
  { value: `${TOTAL_QUESTIONS}`, label: "Questions" },
  // Derived, not typed: this said "3" after Python was added.
  { value: `${QUIZZES.length}`, label: "Topics" },
  { value: `${PASS_PERCENTAGE}%`, label: "To Qualify" },
  { value: "1", label: "Attempt Only" },
] as const

export default async function LandingPage() {
  type Landing = { workshop_name: string; college_name: string }
  let settings: Landing | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("workshop_settings")
      .select("workshop_name, college_name")
      .maybeSingle()
    settings = (data as Landing | null) ?? null
  } catch {
    // The event landing page remains available if Supabase is temporarily down.
  }

  const workshop = settings?.workshop_name ?? "Web Development Workshop"

  return (
    <div className="min-h-dvh flex flex-col bg-midnight">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-[#0c1022]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Link href="/" className="flex min-h-11 items-center gap-2.5 rounded-[var(--radius-chip)]">
            <Logo size={32} />
            <span className="leading-none">
              <span className="block text-sm font-semibold tracking-wide text-ink">WDW</span>
              <span className="mt-1 block text-2xs uppercase tracking-[0.18em] text-ink-muted">Workshop</span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-7 md:flex">
            <Link className="inline-flex min-h-11 items-center text-sm font-medium text-accent-soft hover:text-ink" href="#home">Home</Link>
            <Link className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-ink" href="/about">About</Link>
            <Link className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-ink" href="#quiz">Quiz</Link>
            <Link className="inline-flex min-h-11 items-center text-sm text-ink-muted hover:text-ink" href="#contact">Contact</Link>
          </nav>

          <Button asChild size="md" className="px-5">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main" className="flex flex-1 flex-col">
        {/* Hero Section */}
        <section id="home" className="relative isolate flex flex-1 items-center px-5 py-14 sm:px-8 sm:py-20 lg:py-24 min-h-[680px] xl:min-h-[720px]">
          <div className="hero-beam" aria-hidden />
          <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 xl:gap-14">
            
            {/* Left Content (approx 45%) */}
            <div className="relative z-10 max-w-[580px] xl:max-w-[620px]">
              {/* Pill Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1 text-xs font-medium text-accent-soft">
                <Sparkles className="size-3.5 text-accent" aria-hidden />
                For First Year Students
              </div>

              {/* Main Title */}
              <h1 className="mt-5 text-[clamp(2.5rem,4.8vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-ink">
                Web Development
                <span className="mt-1 block text-accent">Workshop Quiz</span>
              </h1>

              {/* Subtitle */}
              <p id="about" className="mt-5 max-w-[48ch] scroll-mt-24 text-base leading-relaxed text-ink-muted sm:text-lg">
                Test your HTML, CSS, JavaScript and Python skills across four sessions, and earn your certificate.
              </p>

              {/* Highlights Checklist */}
              <ul className="mt-6 space-y-2.5">
                {HIGHLIGHTS.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-ink-muted">
                    <CheckCircle2 className="size-4 shrink-0 text-accent" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>

              {/* CTA Row */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="min-w-44 shadow-[0_4px_20px_rgba(245,79,27,0.35)] transition-transform duration-200 hover:-translate-y-0.5">
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="text-ink-muted hover:text-ink">
                  <Link href="/about">
                    &gt; Learn More
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Visual (approx 55%) */}
            <div className="relative flex w-full items-center justify-center lg:justify-end">
              <HeroVisual className="w-full max-w-[620px] xl:max-w-[680px]" />
            </div>

          </div>
        </section>

        {/* Statistics Section (Naturally follows in document flow) */}
        <section id="quiz" className="scroll-mt-20 border-t border-line/60 px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map(({ value, label }) => (
              <Card key={label} className="p-6 text-center bg-[#12162B]/60 border-line/70 backdrop-blur-xl">
                <p className="font-mono text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  {value}
                </p>
                <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-ink-muted sm:text-sm">
                  {label}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="border-t border-line/60 px-5 py-6 sm:px-8">
        <p className="mx-auto max-w-7xl text-xs text-ink-faint">
          {workshop} · HTML, CSS, JavaScript &amp; Python
        </p>
      </footer>
    </div>
  )
}
