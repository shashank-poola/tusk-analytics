import Image from "next/image"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { routes } from "@/lib/routes"

import { MAKER_URL } from "@/features/marketing/utils/links"
import { FooterWordmark } from "./footer-wordmark"
import { type LandingSection, SectionLink } from "./section-link"

type FooterLink =
  | { label: string; section: LandingSection }
  | { label: string; href: string; external?: true }

/**
 * Tusk's own links. Docs, the changelog, the blog, comparisons and the
 * legal pages are still to be written: until then they show the 404 page.
 */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Live demo", section: "demo" },
      { label: "Features", section: "features" },
      { label: "How it works", section: "how-it-works" },
      { label: "Pricing", section: "pricing" },
      { label: "FAQ", section: "faq" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Start tracking free", href: routes.signIn },
      { label: "Sign in", href: routes.signIn },
      { label: "Install the script", href: routes.installGuide },
      { label: "Docs", href: routes.docs },
    ],
  },
  {
    title: "Compare",
    links: [
      {
        label: "Tusk vs Google Analytics",
        href: routes.compare("google-analytics"),
      },
      { label: "Tusk vs Plausible", href: routes.compare("plausible") },
      { label: "Tusk vs Fathom", href: routes.compare("fathom") },
      { label: "Tusk vs DataFast", href: routes.compare("datafast") },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Changelog", href: routes.changelog },
      { label: "Blog", href: routes.blog },
      { label: "Built in public on X", href: MAKER_URL, external: true },
    ],
  },
  {
    title: "Privacy and terms",
    links: [
      { label: "Privacy", href: routes.privacy },
      { label: "Terms", href: routes.terms },
      { label: "Cookies", href: routes.cookies },
      { label: "Data processing", href: routes.dataProcessing },
    ],
  },
]

const LINK_CLASSES =
  "inline-flex min-h-11 items-center text-[15px] text-muted-foreground transition-colors hover:text-foreground sm:min-h-9"

/**
 * Logo, five columns of links, the maker and Shell, then the giant tile
 * wordmark cropped at the bottom edge. No top border: the FAQ band above
 * fades into it.
 */
export function SiteFooter() {
  return (
    <footer className="overflow-hidden bg-background">
      <div className="mx-auto w-full max-w-[70rem] px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(5,1fr)] lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href={routes.home}
              aria-label="Tusk home"
              className="inline-flex min-h-11 items-center rounded-lg"
            >
              <Logo />
            </Link>
            <p className="mt-3 max-w-[16rem] text-muted-foreground">
              See the people behind your pageviews.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-5">
            {COLUMNS.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="text-[15px] leading-snug">{column.title}</h2>
                <ul className="mt-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <FooterLinkItem link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t-2 border-border pt-6">
          <p className="text-[13px] text-muted-foreground">
            © {new Date().getFullYear()} Tusk. Made by{" "}
            <a
              href={MAKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-link underline-offset-4 hover:underline"
            >
              Shashank
            </a>
            .
          </p>
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            You made it to the bottom. Shell is impressed.
            <Image
              src="/mascot/turtle.png"
              alt="Shell the turtle, strolling along"
              width={56}
              height={56}
              className="size-14"
            />
          </div>
        </div>

        <div className="mt-10 -mb-px">
          <FooterWordmark />
        </div>
      </div>
    </footer>
  )
}

function FooterLinkItem({ link }: { link: FooterLink }) {
  if ("section" in link) {
    return (
      <SectionLink section={link.section} className={LINK_CLASSES}>
        {link.label}
      </SectionLink>
    )
  }
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={LINK_CLASSES}
      >
        {link.label}
      </a>
    )
  }
  return (
    <Link href={link.href} className={LINK_CLASSES}>
      {link.label}
    </Link>
  )
}
