import Link from "next/link"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { routes } from "@/lib/routes"

import { Pill, SECTION_HEADING_CLASSES, Section } from "./section"

/** The real setup, in order. */
const STEPS = [
  {
    title: "Add your site",
    body: "Type your domain. It's the only form you'll fill in.",
  },
  {
    title: "Paste one script",
    body: "One line in your site's head, about 1.5 KB. Works with Next.js, React, Vue or plain HTML.",
  },
  {
    title: "Watch them arrive",
    body: "Your first visitor shows up live, with a name. Tusk throws a tiny party.",
  },
] as const

/** Heading and button on the left, numbered steps on the right. */
export function HowItWorks() {
  return (
    <Section
      tone="alt"
      id="how-it-works"
      labelledBy="how-title"
      className="grid gap-12 lg:grid-cols-2 lg:gap-16"
    >
      <div>
        <Pill>How it works</Pill>
        <h2 id="how-title" className={`${SECTION_HEADING_CLASSES} mt-5`}>
          Up and running in three steps.
        </h2>
        <Link href={routes.signIn} className={`${BUTTON_CLASSES.primary} mt-8`}>
          Start tracking free
        </Link>
      </div>

      <ol>
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="border-b-2 border-border py-8 first:pt-0"
          >
            <span
              aria-hidden="true"
              className="font-mono text-5xl leading-none text-muted-foreground/40"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-xl leading-snug">{step.title}</h3>
            <p className="mt-2 max-w-md text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  )
}
