"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Plus } from "lucide-react"
import { m } from "motion/react"
import { useId, useRef, useState } from "react"

import { DURATION, EASE } from "@/lib/motion"

import { MAKER_URL } from "@/features/marketing/utils/links"

/** Real answers from how Tusk works today. Change one, check the code. */
const QUESTIONS = [
  {
    question: "Can I try it for free?",
    answer:
      "Yes. Tusk is free while it's in beta, and you don't need a credit card. After the beta, plans start at $5 a month.",
  },
  {
    question: "Does Tusk use cookies?",
    answer:
      "Two small first-party cookies with random IDs: one recognises a returning visitor, the other groups pageviews into a visit. No personal data goes in them and nothing is shared with other sites.",
  },
  {
    question: "Is Tusk GDPR friendly?",
    answer:
      "Tusk never stores IP addresses, doesn't fingerprint and collects no personal data: country and city are worked out on our side and the IP is dropped. Because of the cookies, you may still need to mention Tusk in your consent banner. [CONFIRM: legal review]",
  },
  {
    question: "Who are the visitors with names?",
    answer:
      "Made-up names like Curious Puffin, picked from a random ID. You can follow one visitor's path through your site without ever knowing who they are.",
  },
  {
    question: "How big is the script?",
    answer:
      "About 1.5 KB gzipped, with no dependencies. It loads with defer, so it never holds up your page.",
  },
  {
    question: "Does it work with single-page apps?",
    answer:
      "Yes. Tusk counts route changes in Next.js, React, Vue and other single-page apps on its own, with no extra code.",
  },
  {
    question: "Does it work with ad blockers?",
    answer:
      "Not always. Some ad blockers stop analytics scripts, Tusk included, so a share of visits can go uncounted.",
  },
] as const

/**
 * The accordion follows the WAI-ARIA pattern: each question is a button
 * in a heading, arrow keys move between questions, Home and End jump to
 * the ends. One answer is open at a time; opening another closes it.
 * Answers stay in the HTML when closed (inert, height 0), so search
 * engines and find-in-page still read them.
 */
export function Faq() {
  const id = useId()
  const [open, setOpen] = useState<number | null>(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function focusQuestion(index: number) {
    const count = QUESTIONS.length
    buttons.current[(index + count) % count]?.focus()
  }

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const moves: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: QUESTIONS.length - 1,
    }
    const next = moves[event.key]
    if (next === undefined) return
    event.preventDefault()
    focusQuestion(next)
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
      <div>
        <h2
          id="faq-title"
          className="text-[2rem] leading-[1.1] text-balance sm:text-[2.5rem]"
        >
          Questions, answered.
        </h2>
        <p className="mt-4 text-muted-foreground">
          Can&apos;t find yours?{" "}
          <a
            href={MAKER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-link underline-offset-4 hover:underline"
          >
            Ask Shashank on X
          </a>
          .
        </p>
      </div>

      <ul className="border-t-2 border-border">
        {QUESTIONS.map((item, index) => {
          const isOpen = open === index
          const buttonId = `${id}-q-${index}`
          const panelId = `${id}-a-${index}`
          return (
            <li key={item.question} className="border-b-2 border-border">
              <h3 className="font-sans text-[17px] font-semibold">
                <button
                  ref={(node) => {
                    buttons.current[index] = node
                  }}
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className="flex min-h-16 w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:text-link"
                >
                  {item.question}
                  <m.span
                    aria-hidden="true"
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: DURATION.fast, ease: EASE }}
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                      isOpen
                        ? "bg-accent text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Plus className="size-4" strokeWidth={2.5} />
                  </m.span>
                </button>
              </h3>
              <m.div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                inert={!isOpen}
                initial={false}
                animate={{
                  height: isOpen ? "auto" : 0,
                  opacity: isOpen ? 1 : 0,
                }}
                transition={{ duration: 0.2, ease: EASE }}
                className="overflow-hidden"
              >
                <p className="max-w-[60ch] pr-12 pb-5 text-muted-foreground">
                  {item.answer}
                </p>
              </m.div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
