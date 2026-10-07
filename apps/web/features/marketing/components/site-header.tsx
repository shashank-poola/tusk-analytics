"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Menu } from "lucide-react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { Logo, LogoMark } from "@/components/brand/logo"
import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { routes } from "@/lib/routes"

import { type LandingSection, SectionLink } from "./section-link"

const NAV = [
  { section: "features", label: "Features" },
  { section: "pricing", label: "Pricing" },
  { section: "faq", label: "FAQ" },
] as const satisfies { section: LandingSection; label: string }[]

const TEXT_LINK_CLASSES =
  "inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"

/**
 * Sticky landing header. The 1 px bottom border appears once the page has
 * scrolled; on phones it's the mark alone and a menu.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const menuRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 0)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  const closeMenu = () => menuRef.current?.removeAttribute("open")

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b bg-background/90 backdrop-blur transition-colors",
        scrolled ? "border-border" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[70rem] items-center gap-2 px-4 sm:px-6">
        <Link
          href={routes.home}
          aria-label="Tusk home"
          className="inline-flex min-h-11 items-center rounded-lg"
        >
          <Logo className="hidden sm:inline-flex" />
          <LogoMark className="size-11 sm:hidden" />
        </Link>

        <nav aria-label="Main" className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.section}>
                <SectionLink
                  section={item.section}
                  className={TEXT_LINK_CLASSES}
                >
                  {item.label}
                </SectionLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href={routes.signIn}
            className={cn(TEXT_LINK_CLASSES, "hidden sm:inline-flex")}
          >
            Sign in
          </Link>
          <Link href={routes.signIn} className={BUTTON_CLASSES.primary}>
            Get started
          </Link>

          <details ref={menuRef} className="relative md:hidden">
            <summary
              aria-label="Menu"
              className="inline-grid size-11 cursor-pointer list-none place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden="true" className="size-5" />
            </summary>
            <nav
              aria-label="Menu"
              className="absolute right-0 mt-2 w-56 rounded-2xl border-2 border-border bg-surface p-2 shadow-pop"
            >
              <ul>
                {NAV.map((item) => (
                  <li key={item.section}>
                    <SectionLink
                      section={item.section}
                      onNavigate={closeMenu}
                      className={cn(TEXT_LINK_CLASSES, "w-full")}
                    >
                      {item.label}
                    </SectionLink>
                  </li>
                ))}
                <li>
                  <Link
                    href={routes.signIn}
                    onClick={closeMenu}
                    className={cn(TEXT_LINK_CLASSES, "w-full")}
                  >
                    Sign in
                  </Link>
                </li>
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  )
}
