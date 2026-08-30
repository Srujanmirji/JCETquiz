"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/**
 * Premium Dark-Tech Hero Visual
 *
 * Built entirely with real HTML/CSS DOM elements and SVG vectors:
 * - Real CodeEditor component with titlebar, line numbers, syntax-highlighted code & glowing </> symbol
 * - Real DOM HeroBadge components (HTML, CSS, JS) with independent floating physics
 * - Smooth SVG orbital paths (zero dangling artifacts) with animated dash strokes
 * - Interactive Desktop Mouse Parallax with smooth lerp interpolation
 * - Concentrated orange & blue ambient glows
 * - Subtle drifting luminous micro-particles
 * - Responsive & accessible (prefers-reduced-motion support)
 */
export function HeroVisual({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Parallax target and current values for smooth lerp physics
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const targetPos = useRef({ x: 0, y: 0 })
  const currentPos = useRef({ x: 0, y: 0 })
  const isHovered = useRef(false)

  useEffect(() => {
    // Disable parallax if reduced motion is requested or touch device
    if (typeof window === "undefined") return
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mediaQuery.matches) return

    let animationFrameId: number

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      // Normalized coordinates from -1 to 1
      const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (rect.width / 2)))
      const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (rect.height / 2)))

      targetPos.current = { x: normX, y: normY }
      isHovered.current = true
    }

    const handleMouseLeave = () => {
      targetPos.current = { x: 0, y: 0 }
      isHovered.current = false
    }

    const container = containerRef.current
    if (container) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true })
      container.addEventListener("mouseleave", handleMouseLeave)
    }

    // Smooth Lerp loop (60fps)
    const updateParallax = () => {
      const ease = 0.06
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * ease
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * ease

      setMousePos({
        x: Number(currentPos.current.x.toFixed(4)),
        y: Number(currentPos.current.y.toFixed(4)),
      })

      animationFrameId = requestAnimationFrame(updateParallax)
    }

    animationFrameId = requestAnimationFrame(updateParallax)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (container) container.removeEventListener("mouseleave", handleMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto w-full max-w-[620px] xl:max-w-[680px] select-none perspective-[1400px]",
        className,
      )}
      aria-hidden="true"
    >
      {/* 
        Container with balanced aspect-ratio (580 x 480):
        Occupies the right column naturally without spilling outside.
      */}
      <div className="relative w-full aspect-[580/460] sm:aspect-[620/480] xl:aspect-[660/500] overflow-visible">

        {/* =========================================================================
            1. AMBIENT GLOWS (Parallax Layer 1: 1.5px)
           ========================================================================= */}
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * 2}px, ${mousePos.y * 2}px, 0)`,
          }}
        >
          {/* Core Orange Glow behind Code Editor */}
          <div
            className="absolute left-1/2 top-[48%] size-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[75px] opacity-75 hero-animated-glow"
            style={{
              background:
                "radial-gradient(circle, rgba(245, 79, 27, 0.45) 0%, rgba(245, 79, 27, 0.12) 45%, transparent 70%)",
            }}
          />

          {/* Sky Blue Glow around CSS Badge side */}
          <div
            className="absolute -right-[4%] top-[30%] size-[45%] rounded-full blur-[70px] opacity-40 hero-animated-glow-blue"
            style={{
              background:
                "radial-gradient(circle, rgba(56, 189, 248, 0.3) 0%, rgba(30, 34, 61, 0.15) 50%, transparent 70%)",
            }}
          />
        </div>

        {/* =========================================================================
            2. ELLIPTICAL ORBITAL SYSTEM (Parallax Layer 2: 4px — Pure SVG)
           ========================================================================= */}
        <div
          className="pointer-events-none absolute inset-0 size-full z-0 overflow-visible transition-transform duration-100 ease-out"
          style={{
            transform: `translate3d(${mousePos.x * 4}px, ${mousePos.y * 4}px, 0)`,
          }}
        >
          <svg
            className="size-full overflow-visible opacity-85"
            viewBox="0 0 600 480"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Orange Neon Gradient */}
              <linearGradient id="heroOrbitOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F54F1B" stopOpacity="0.05" />
                <stop offset="25%" stopColor="#F54F1B" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#FF7A45" stopOpacity="1" />
                <stop offset="90%" stopColor="#F54F1B" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#F54F1B" stopOpacity="0.02" />
              </linearGradient>

              {/* Blue Neon Gradient */}
              <linearGradient id="heroOrbitBlueGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.05" />
                <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.95" />
                <stop offset="70%" stopColor="#818CF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
              </linearGradient>

              {/* Secondary Soft Orange Gradient */}
              <linearGradient id="heroOrbitSecGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F54F1B" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#F54F1B" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#F54F1B" stopOpacity="0.3" />
              </linearGradient>

              <filter id="heroGlowOrange" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="heroGlowBlue" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Primary Orange Diagonal Orbit */}
            <ellipse
              cx="300"
              cy="235"
              rx="260"
              ry="130"
              transform="rotate(-15 300 235)"
              stroke="url(#heroOrbitOrangeGrad)"
              strokeWidth="1.8"
              strokeDasharray="16 12 360 20"
              filter="url(#heroGlowOrange)"
              className="hero-orbit-line-orange"
            />

            {/* Primary Blue / Cyan Horizontal Orbit */}
            <ellipse
              cx="305"
              cy="245"
              rx="270"
              ry="120"
              transform="rotate(9 305 245)"
              stroke="url(#heroOrbitBlueGrad)"
              strokeWidth="1.6"
              strokeDasharray="20 14 320 16"
              filter="url(#heroGlowBlue)"
              className="hero-orbit-line-blue"
            />

            {/* Secondary Subtle Orange Track */}
            <ellipse
              cx="295"
              cy="230"
              rx="220"
              ry="100"
              transform="rotate(-26 295 230)"
              stroke="url(#heroOrbitSecGrad)"
              strokeWidth="1"
              strokeDasharray="6 8"
            />
          </svg>
        </div>

        {/* =========================================================================
            3. DRIFTING PARTICLES & SPARKS (10 Subtle Micro-Particles)
           ========================================================================= */}
        <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
          <span className="absolute left-[14%] top-[24%] size-[3.5px] rounded-full bg-accent shadow-[0_0_8px_#F54F1B] hero-animated-particle-1" />
          <span className="absolute right-[14%] top-[26%] size-[3px] rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8] hero-animated-particle-2" />
          <span className="absolute left-[18%] bottom-[16%] size-[3px] rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B] hero-animated-particle-3" />
          <span
            className="absolute right-[8%] bottom-[30%] size-[2.5px] rounded-full bg-accent shadow-[0_0_6px_#F54F1B] hero-animated-particle-1"
            style={{ animationDelay: "-2.2s" }}
          />
          <span
            className="absolute left-[45%] top-[8%] size-[2.5px] rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8] hero-animated-particle-2"
            style={{ animationDelay: "-3.5s" }}
          />
          <span
            className="absolute right-[32%] bottom-[12%] size-[2px] rounded-full bg-[#F59E0B] shadow-[0_0_5px_#F59E0B] hero-animated-particle-3"
            style={{ animationDelay: "-1.7s" }}
          />
          <span
            className="absolute left-[8%] top-[48%] size-[2px] rounded-full bg-accent shadow-[0_0_5px_#F54F1B] hero-animated-particle-1"
            style={{ animationDelay: "-4.2s" }}
          />
          <span
            className="absolute right-[22%] top-[14%] size-[2px] rounded-full bg-[#38BDF8] shadow-[0_0_5px_#38BDF8] hero-animated-particle-2"
            style={{ animationDelay: "-1.1s" }}
          />
        </div>

        {/* =========================================================================
            4. ROTATING BASE PLATFORM (Beneath Code Editor)
           ========================================================================= */}
        <div
          className="pointer-events-none absolute z-10 hero-animated-rings-container"
          style={{
            left: "50%",
            bottom: "3%",
            transform: "translateX(-50%)",
            width: "66%",
            height: "24%",
          }}
        >
          {/* Ground Neon Pulse */}
          <div className="absolute inset-x-4 inset-y-1 rounded-[50%] bg-accent/25 blur-[18px] hero-animated-ring-pulse" />

          {/* Concentric Elliptical Rings */}
          <div className="relative size-full hero-animated-rings-spin">
            <svg viewBox="0 0 400 140" fill="none" className="size-full opacity-90">
              <ellipse cx="200" cy="70" rx="190" ry="58" stroke="url(#heroOrbitOrangeGrad)" strokeWidth="1.5" strokeDasharray="12 8" />
              <ellipse cx="200" cy="70" rx="160" ry="46" stroke="#F54F1B" strokeOpacity="0.4" strokeWidth="1.2" />
              <ellipse cx="200" cy="70" rx="125" ry="34" stroke="#FF7A45" strokeOpacity="0.6" strokeWidth="1.4" strokeDasharray="8 6" />
              <ellipse cx="200" cy="70" rx="80" ry="20" stroke="#F54F1B" strokeOpacity="0.8" strokeWidth="1.8" />
            </svg>
          </div>
        </div>

        {/* =========================================================================
            5. CENTRAL 3D CODE EDITOR (Parallax Layer 3: 8px — Dominant Centerpiece)
           ========================================================================= */}
        <div
          className="absolute z-20 transition-transform duration-100 ease-out"
          style={{
            left: "50%",
            top: "47%",
            transform: `translate(-50%, -50%) translate3d(${mousePos.x * 8}px, ${mousePos.y * 8}px, 0)`,
            width: "74%",
            maxWidth: "480px",
            aspectRatio: "480 / 370",
            transformStyle: "preserve-3d",
          }}
        >
          <div className="relative size-full hero-animated-window">
            <CodeEditor />
          </div>
        </div>

        {/* =========================================================================
            6. FLOATING HTML, CSS, JS BADGES (Parallax Layer 4: 6px)
           ========================================================================= */}
        
        {/* HTML Badge (Top Left of Window) */}
        <div
          className="absolute z-30 transition-transform duration-100 ease-out"
          style={{
            left: "4%",
            top: "14%",
            transform: `translate3d(${mousePos.x * 6}px, ${mousePos.y * 6}px, 0)`,
          }}
        >
          <div className="hero-animated-badge-html">
            <HeroBadge type="html" label="HTML" />
          </div>
        </div>

        {/* CSS Badge (Right of Window) */}
        <div
          className="absolute z-30 transition-transform duration-100 ease-out"
          style={{
            right: "3%",
            top: "36%",
            transform: `translate3d(${mousePos.x * 6}px, ${mousePos.y * 6}px, 0)`,
          }}
        >
          <div className="hero-animated-badge-css">
            <HeroBadge type="css" label="CSS" />
          </div>
        </div>

        {/* JS Badge (Bottom Left of Window) */}
        <div
          className="absolute z-30 transition-transform duration-100 ease-out"
          style={{
            left: "6%",
            bottom: "10%",
            transform: `translate3d(${mousePos.x * 6}px, ${mousePos.y * 6}px, 0)`,
          }}
        >
          <div className="hero-animated-badge-js">
            <HeroBadge type="js" label="JS" />
          </div>
        </div>

      </div>
    </div>
  )
}

/**
 * Real DOM Code Editor Component
 */
function CodeEditor() {
  return (
    <div className="relative size-full overflow-hidden rounded-[20px] sm:rounded-[24px] border border-white/15 bg-[#12162B]/85 backdrop-blur-2xl shadow-[0_24px_60px_-16px_rgba(0,0,0,0.92),0_0_40px_rgba(245,79,27,0.14)] flex flex-col">
      
      {/* Specular Top Border Highlight */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      {/* Editor Titlebar */}
      <div className="relative flex h-10 sm:h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#0e1224]/80 px-4 sm:px-5">
        {/* Mac Titlebar Dots */}
        <div className="flex items-center gap-2">
          <span className="size-2.5 sm:size-3 rounded-full bg-[#EF4444] shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
          <span className="size-2.5 sm:size-3 rounded-full bg-[#F59E0B] shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
          <span className="size-2.5 sm:size-3 rounded-full bg-[#38BDF8] shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
        </div>

        {/* Tab Pill */}
        <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 text-2xs font-mono text-ink-muted">
          <span className="size-1.5 rounded-full bg-accent" />
          <span>workshop.html</span>
        </div>

        {/* Action Icon */}
        <div className="flex items-center gap-1 opacity-40">
          <span className="h-2 w-4 rounded-sm border border-white/40" />
        </div>
      </div>

      {/* Editor Code Area */}
      <div className="relative flex flex-1 overflow-hidden p-3 sm:p-4 text-[10px] sm:text-[11px] font-mono leading-relaxed select-none">
        
        {/* Line Numbers Gutter */}
        <div className="flex flex-col select-none pr-3 sm:pr-4 text-right text-ink-faint/50 font-mono text-[9px] sm:text-[10px]">
          <span>01</span>
          <span>02</span>
          <span>03</span>
          <span>04</span>
          <span>05</span>
          <span>06</span>
          <span>07</span>
          <span>08</span>
          <span>09</span>
        </div>

        {/* Code Content */}
        <div className="flex flex-1 flex-col space-y-0.5 text-ink-muted opacity-75">
          <div className="flex items-center gap-1">
            <span className="text-[#F54F1B]">&lt;div</span>
            <span className="text-[#38BDF8]">class</span>=
            <span className="text-[#34D399]">&quot;workshop&quot;</span>
            <span className="text-[#F54F1B]">&gt;</span>
          </div>

          <div className="pl-3 flex items-center gap-1">
            <span className="text-[#818CF8]">const</span>
            <span className="text-ink">quiz</span> =
            <span className="text-[#F59E0B]">new</span>
            <span className="text-[#38BDF8]">DevQuiz</span>();
          </div>

          <div className="pl-3 flex items-center gap-1">
            <span className="text-ink-muted">quiz.</span>
            <span className="text-[#38BDF8]">start</span>({`{`}
            <span className="text-[#34D399]">&quot;HTML&quot;</span>,
            <span className="text-[#34D399]">&quot;CSS&quot;</span>
            {`}`});
          </div>

          <div className="pl-3 flex items-center gap-1">
            <span className="text-[#F54F1B]">&lt;span</span>
            <span className="text-[#38BDF8]">score</span>=
            <span className="text-[#F59E0B]">70%</span>
            <span className="text-[#F54F1B]">&gt;</span>
          </div>

          <div className="pl-3 flex items-center gap-1">
            <span className="text-[#38BDF8]">cert.</span>
            <span className="text-[#34D399]">verify</span>();
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[#F54F1B]">&lt;/div&gt;</span>
          </div>
        </div>

        {/* Centerpiece: Dominant Glowing </> Coding Symbol */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Ambient Symbol Glow */}
            <div className="absolute size-28 rounded-full bg-accent/25 blur-2xl" />

            {/* Glowing SVG Coding Bracket */}
            <svg
              className="relative size-24 sm:size-28 text-accent drop-shadow-[0_0_28px_rgba(245,79,27,0.7)]"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M32 28 L14 50 L32 72"
                stroke="#F54F1B"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M68 28 L86 50 L68 72"
                stroke="#F54F1B"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M58 20 L42 80"
                stroke="#F54F1B"
                strokeWidth="6.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

      </div>

      {/* Editor Status Bar */}
      <div className="flex h-6 shrink-0 items-center justify-between border-t border-white/10 bg-[#0a0d1a]/80 px-4 text-[9px] font-mono text-ink-faint">
        <div className="flex items-center gap-2">
          <span className="text-accent">● LIVE</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <span>HTML / CSS / JS</span>
          <span>100%</span>
        </div>
      </div>

      {/* Specular Light Sweep Shimmer across the Glass */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] sm:rounded-[24px]">
        <div
          className="absolute -inset-full hero-animated-sweep"
          style={{
            background:
              "linear-gradient(108deg, transparent 35%, rgba(255, 255, 255, 0.0) 44%, rgba(255, 255, 255, 0.22) 50%, rgba(245, 79, 27, 0.18) 54%, transparent 64%)",
          }}
        />
      </div>

    </div>
  )
}

/**
 * Real DOM Floating Badge Component
 */
function HeroBadge({
  type,
  label,
}: {
  type: "html" | "css" | "js"
  label: string
}) {
  const styles = {
    html: {
      border: "border-[#F54F1B]/60",
      bg: "bg-[#12162B]/90",
      text: "text-[#F54F1B]",
      shadow: "shadow-[0_8px_24px_rgba(245,79,27,0.38)]",
      glow: "bg-[#F54F1B]/15",
      dot: "bg-[#F54F1B]",
    },
    css: {
      border: "border-[#38BDF8]/60",
      bg: "bg-[#12162B]/90",
      text: "text-[#38BDF8]",
      shadow: "shadow-[0_8px_24px_rgba(56,189,248,0.38)]",
      glow: "bg-[#38BDF8]/15",
      dot: "bg-[#38BDF8]",
    },
    js: {
      border: "border-[#F59E0B]/60",
      bg: "bg-[#12162B]/90",
      text: "text-[#F59E0B]",
      shadow: "shadow-[0_8px_24px_rgba(245,158,11,0.38)]",
      glow: "bg-[#F59E0B]/15",
      dot: "bg-[#F59E0B]",
    },
  }[type]

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-xl sm:rounded-2xl border px-3.5 py-2 sm:px-4 sm:py-2.5 backdrop-blur-xl transition-all duration-300",
        styles.border,
        styles.bg,
        styles.shadow,
      )}
    >
      <span className={cn("size-2 rounded-full animate-pulse", styles.dot)} />
      <span className={cn("text-xs sm:text-sm font-bold tracking-wider uppercase font-mono", styles.text)}>
        {label}
      </span>
    </div>
  )
}
