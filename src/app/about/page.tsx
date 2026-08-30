import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { StudentShell } from "@/components/marketing/shell"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/surface"
import {
  PASS_PERCENTAGE,
  PASS_SCORE,
  QUESTIONS_PER_QUIZ,
  QUIZZES,
  TOTAL_QUESTIONS,
  type QuizSlug,
} from "@/lib/constants"

export const metadata: Metadata = {
  title: "About the workshop",
  description: "Explore the JCET Developer’s Club workshop: beginner-friendly HTML, CSS, JavaScript and Python quizzes, participation steps and certificate eligibility.",
}

const TOPIC_DESCRIPTIONS: Record<QuizSlug, string> = {
  html: "The building blocks of a web page: tags, headings, links and images.",
  css: "How a page looks: colours, fonts, spacing and basic styling.",
  javascript: "Programming for the web: variables, functions and simple expressions.",
  python: "Programming fundamentals: variables, data types, loops and functions.",
}

export default function AboutPage() {
  return (
    <StudentShell
      width="wide"
      meta={<Button asChild variant="secondary"><Link href="/login">Login</Link></Button>}
    >
      <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Back to home
      </Link>

      <header className="mt-6 max-w-2xl">
        <p className="text-sm font-medium text-accent-soft">JCET Developer’s Club</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          About the workshop
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink-muted">
          Start with the basics. Check what you’ve learned.
        </p>
        <p className="mt-3 text-base leading-relaxed text-ink-muted">
          Built for first-year students, the Web Development Workshop Quiz helps you
          practise HTML, CSS, JavaScript and Python through easy, beginner-friendly
          multiple-choice questions.
        </p>
      </header>

      <div className="mt-10 grid items-start gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-16">
        <section aria-labelledby="topics-title">
          <h2 id="topics-title" className="text-2xl font-semibold tracking-tight text-ink">
            What you’ll cover
          </h2>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {QUIZZES.map((quiz) => (
              <li key={quiz.slug} className="py-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-medium text-ink">{quiz.title}</h3>
                  <span className="text-sm text-ink-muted">{QUESTIONS_PER_QUIZ} questions</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {TOPIC_DESCRIPTIONS[quiz.slug]}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <Panel className="p-6 sm:p-8">
          <section aria-labelledby="participate-title">
            <h2 id="participate-title" className="text-2xl font-semibold tracking-tight text-ink">
              How to take part
            </h2>
            <ol className="mt-6 list-decimal space-y-5 pl-5 text-sm text-ink-muted marker:font-semibold marker:text-accent-soft">
              <li className="pl-2">
                <h3 className="font-medium text-ink">Sign in and complete your profile</h3>
                <p className="mt-1 leading-relaxed">Use your Google account and add your student details.</p>
              </li>
              <li className="pl-2">
                <h3 className="font-medium text-ink">Join each quiz session</h3>
                <p className="mt-1 leading-relaxed">
                  Your instructor opens each topic quiz. Check your dashboard for the
                  available session. You have one attempt per topic, so review your
                  answers before submitting.
                </p>
              </li>
              <li className="pl-2">
                <h3 className="font-medium text-ink">See your results</h3>
                <p className="mt-1 leading-relaxed">
                  Your submitted scores are saved. The {QUIZZES.length} quizzes add up
                  to {TOTAL_QUESTIONS} questions and one overall workshop result.
                </p>
              </li>
            </ol>
          </section>

          <section aria-labelledby="certificate-title" className="mt-7 border-t border-line pt-6">
            <h2 id="certificate-title" className="text-lg font-semibold text-ink">Earn your certificate</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Score at least <span className="font-medium text-ink">{PASS_SCORE} out of {TOTAL_QUESTIONS} ({PASS_PERCENTAGE}%)</span>{" "}
              overall to qualify. The workshop team sends certificates to eligible students.
            </p>
          </section>

          <Button asChild size="lg" className="mt-6 w-full">
            <Link href="/login">Get Started<ArrowRight className="size-4" aria-hidden /></Link>
          </Button>
        </Panel>
      </div>
    </StudentShell>
  )
}
