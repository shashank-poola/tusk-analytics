"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { routes } from "@/lib/routes"

/** The landing page's sections that links can jump to. */
export type LandingSection =
  "demo" | "features" | "how-it-works" | "pricing" | "faq"

// Set when a section link is clicked away from the landing page; the
// landing page scrolls to it once it has loaded.
const PENDING_SECTION_KEY = "tusk:pending-section"

function scrollToSection(section: string) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  document
    .getElementById(section)
    ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
}

type SectionLinkProps = {
  section: LandingSection
  className?: string
  /** Runs after the click, e.g. to close the phone menu. */
  onNavigate?: () => void
  children: React.ReactNode
}

/**
 * A link to a landing section that leaves the address bar clean ("/", not
 * "/#features"). The href keeps the hash, so a new tab or a click without
 * JavaScript still lands on the section.
 */
export function SectionLink({
  section,
  className,
  onNavigate,
  children,
}: SectionLinkProps) {
  const pathname = usePathname()
  const router = useRouter()
  return (
    <a
      href={`${routes.home}#${section}`}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return
        event.preventDefault()
        onNavigate?.()
        if (pathname === routes.home) {
          scrollToSection(section)
          return
        }
        try {
          sessionStorage.setItem(PENDING_SECTION_KEY, section)
        } catch {
          // Storage blocked: the landing page just opens at the top.
        }
        router.push(routes.home)
      }}
    >
      {children}
    </a>
  )
}

/** On the landing page: scrolls to a section picked on another page. */
export function PendingSectionScroll() {
  useEffect(() => {
    let section: string | null = null
    try {
      section = sessionStorage.getItem(PENDING_SECTION_KEY)
      sessionStorage.removeItem(PENDING_SECTION_KEY)
    } catch {
      return
    }
    if (section) scrollToSection(section)
  }, [])
  return null
}
