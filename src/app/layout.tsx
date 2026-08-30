import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Web Development Workshop",
    template: "%s · Web Development Workshop",
  },
  description:
    "A two-day workshop on HTML, CSS, JavaScript and Python for first-year students. Four quizzes, instant results, and a certificate at 70%.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#080a14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {/* Atmosphere lives here and nowhere else. The veil sits above the
            orbs and below the content, so body copy is always measured against
            a controlled ground rather than the brightest part of a gradient. */}
        <div className="ambient" aria-hidden />
        <div className="ambient-veil" aria-hidden />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-chip)] focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-accent"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
