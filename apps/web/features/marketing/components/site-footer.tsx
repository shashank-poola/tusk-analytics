import Link from "next/link"

import { routes } from "@/lib/routes"

import { MAKER_URL } from "@/features/marketing/utils/links"
import { FooterThemeSwitch } from "./footer-theme-switch"
import { type LandingSection, SectionLink } from "./section-link"

type FooterLink =
  | { label: string; section: LandingSection }
  | { label: string; href: string; external?: true }

type Column = { title: string; links: FooterLink[] }

/**
 * Tusk's own links. Docs, the changelog, the blog, comparisons and the
 * legal pages are still to be written: until then they show the 404 page.
 * Each entry is one column; a column with two groups stacks them.
 */
const COLUMNS: Column[][] = [
  [
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
  ],
  [
    {
      title: "Get started",
      links: [
        { label: "Start tracking free", href: routes.signIn },
        { label: "Sign in", href: routes.signIn },
        { label: "Install the script", href: routes.installGuide },
        { label: "Docs", href: routes.docs },
      ],
    },
  ],
  [
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
  ],
  [
    {
      title: "Resources",
      links: [
        { label: "Changelog", href: routes.changelog },
        { label: "Blog", href: routes.blog },
      ],
    },
  ],
  [
    {
      title: "Privacy and terms",
      links: [
        { label: "Privacy", href: routes.privacy },
        { label: "Terms", href: routes.terms },
        { label: "Cookies", href: routes.cookies },
        { label: "Data processing", href: routes.dataProcessing },
      ],
    },
    {
      title: "Social",
      links: [{ label: "X (Twitter)", href: MAKER_URL, external: true }],
    },
  ],
]

const LINK_CLASSES =
  "inline-flex min-h-11 items-center text-[15px] font-semibold text-white/80 transition-colors hover:text-white sm:min-h-8"

/**
 * One solid band, like Duolingo's: Deep Water in light mode, the page's
 * near-black in dark mode with the wordmark in Tusk Blue, so the theme
 * switch visibly changes it. Bold headings and link columns, the maker
 * and the theme switch, then a giant "tusk" cropped at the bottom.
 * White on Deep Water is about 6.6:1, so 15 px links stay readable.
 * `relative z-10` keeps the FAQ band's fade from tinting it.
 */
export function SiteFooter() {
  return (
    <footer className="relative z-10 overflow-hidden bg-deep-water text-white dark:bg-background">
      <div className="mx-auto w-full max-w-[70rem] px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((groups) => (
            <div key={groups[0]?.title} className="space-y-10">
              {groups.map((column) => (
                <nav key={column.title} aria-label={column.title}>
                  <h2 className="text-lg leading-snug">{column.title}</h2>
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
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-6 border-t-2 border-white/20 pt-6 text-[13px] text-white/80">
          <p>
            © {new Date().getFullYear()} Tusk. Made by{" "}
            <a
              href={MAKER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline-offset-4 hover:underline"
            >
              Shashank
            </a>
            .
          </p>
          <FooterThemeSwitch />
        </div>

        {/* Sized to the container's width (cqw), cropped at the bottom. Its
            letters rise above its box (tight leading), so it must never
            catch clicks meant for the theme switch above it. */}
        <div
          aria-hidden="true"
          className="@container pointer-events-none mt-6 select-none"
        >
          <p className="-mb-[5cqw] text-center font-heading text-[52cqw] leading-[0.8] font-bold text-white dark:text-accent">
            tusk
          </p>
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
