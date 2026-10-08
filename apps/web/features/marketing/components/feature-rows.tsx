import { cn } from "@workspace/ui/lib/utils"

import {
  DemoBreakdown,
  DemoOverviewCard,
  DemoUsersCard,
} from "./demo/demo-cards"
import { Section } from "./section"

/** Every feature card is this tall, so the rows line up. */
const CARD_HEIGHT = "h-[23rem]"

/**
 * Only features that are built today, each shown with the dashboard's own
 * card and sample data. A planned one would get a "Coming soon" pill.
 */
const FEATURES = [
  {
    id: "live",
    title: "See who's online right now",
    body: "A live count of visitors on your site, updating as they arrive.",
    card: <DemoOverviewCard variant="live" className={CARD_HEIGHT} />,
  },
  {
    id: "sources",
    title: "Know where people come from",
    body: "Referrers, entry pages, countries and devices on one page. No report builder.",
    card: <DemoBreakdown card="Sources" compact className={CARD_HEIGHT} />,
  },
  {
    id: "places",
    title: "See where in the world they are",
    body: "Country and city for every visit, worked out on our side. Tusk never stores IP addresses.",
    card: <DemoBreakdown card="Locations" compact className={CARD_HEIGHT} />,
  },
  {
    id: "visitors",
    title: "Visitors with names",
    body: "Every visitor gets a friendly name, like Curious Puffin.",
    card: <DemoUsersCard count={4} className={CARD_HEIGHT} />,
  },
] as const

/**
 * Text and a real dashboard card, swapping sides row by row; no mascots.
 * The card column is twice the text column on every row, wide enough for
 * the visitors table, so all four cards are the same size.
 */
export function FeatureRows() {
  return (
    <Section tone="page" id="features" labelledBy="features-title">
      <h2 id="features-title" className="sr-only">
        Features
      </h2>
      <div className="space-y-16 sm:space-y-24">
        {FEATURES.map((feature, index) => {
          const cardFirst = index % 2 === 1
          return (
            <article
              key={feature.id}
              className={cn(
                "grid items-center gap-8 lg:gap-14",
                cardFirst ? "lg:grid-cols-[2fr_1fr]" : "lg:grid-cols-[1fr_2fr]"
              )}
            >
              <div className={cn(cardFirst && "lg:order-2")}>
                <h3 className="text-[1.75rem] leading-[1.15] text-balance sm:text-[2rem]">
                  {feature.title}
                </h3>
                <p className="mt-4 max-w-[28rem] text-lg leading-normal text-muted-foreground">
                  {feature.body}
                </p>
              </div>
              <div className="min-w-0">{feature.card}</div>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
