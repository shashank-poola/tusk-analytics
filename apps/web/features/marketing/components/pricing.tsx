"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Check } from "lucide-react"
import { m } from "motion/react"
import Link from "next/link"
import { useId, useState } from "react"

import { BUTTON_CLASSES } from "@/components/ui/button-styles"
import { DURATION, EASE } from "@/lib/motion"
import { routes } from "@/lib/routes"

import { MAKER_URL } from "@/features/marketing/utils/links"
import {
  type Billing,
  CUSTOM_TIER,
  eventsLabel,
  formatDollars,
  type Plan,
  PLANS,
  planPrice,
} from "@/features/marketing/utils/pricing"
import { Pill, SECTION_HEADING_CLASSES, Section } from "./section"

/**
 * Pick monthly events on a slider and monthly or yearly billing; both
 * plans reprice as you go. Every plan has every feature: they differ in
 * events and sites.
 */
export function Pricing() {
  const id = useId()
  const [tier, setTier] = useState(0)
  const [billing, setBilling] = useState<Billing>("monthly")
  const events = eventsLabel(tier)

  return (
    <Section tone="page" id="pricing" labelledBy="pricing-title">
      <div className="text-center">
        <Pill>Free during beta</Pill>
        <h2 id="pricing-title" className={`${SECTION_HEADING_CLASSES} mt-5`}>
          Pricing that grows with your traffic.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          Every plan gets every feature. Pick how many events and sites you
          need.
        </p>
      </div>

      <div className="mx-auto mt-12 max-w-3xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor={`${id}-events`}
              className="flex items-baseline justify-between text-[15px]"
            >
              <span className="font-semibold">Monthly events</span>
              <span className="text-muted-foreground">
                Up to <strong className="text-foreground">{events}</strong>
              </span>
            </label>
            <input
              id={`${id}-events`}
              type="range"
              min={0}
              max={CUSTOM_TIER}
              step={1}
              value={tier}
              onChange={(event) => setTier(Number(event.target.value))}
              aria-valuetext={`Up to ${events} monthly events`}
              className="mt-3 h-11 w-full cursor-pointer accent-accent"
            />
            <div
              aria-hidden="true"
              className="flex justify-between text-[13px] text-muted-foreground"
            >
              <span>10k</span>
              <span>10M+</span>
            </div>
          </div>

          <BillingSwitch billing={billing} onChange={setBilling} />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              tier={tier}
              billing={billing}
              events={events}
            />
          ))}
        </div>
        <p className="mt-5 text-center text-[13px] text-muted-foreground">
          Free during beta. No credit card needed.
        </p>
      </div>
    </Section>
  )
}

function BillingSwitch({
  billing,
  onChange,
}: {
  billing: Billing
  onChange: (billing: Billing) => void
}) {
  const options: { id: Billing; label: string }[] = [
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
  ]
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <span className="text-[13px] font-semibold text-positive">
        Yearly: 2 months free
      </span>
      <div
        role="group"
        aria-label="Billing"
        className="inline-flex rounded-xl bg-muted p-1"
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={billing === option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex h-11 items-center rounded-lg px-4 text-[15px] font-semibold transition-colors sm:h-9",
              billing === option.id
                ? "bg-surface text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

type PlanCardProps = {
  plan: Plan
  tier: number
  billing: Billing
  events: string
}

function PlanCard({ plan, tier, billing, events }: PlanCardProps) {
  const price = planPrice(plan, tier, billing)
  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        "flex flex-col rounded-2xl border-2 bg-surface p-6 sm:p-7",
        plan.id === "growth" ? "border-accent" : "border-border"
      )}
    >
      <h3 id={`plan-${plan.id}`} className="text-lg">
        {plan.name}
      </h3>

      <div className="mt-4 min-h-[4.5rem]" aria-live="polite">
        {/* A new price slides in; with reduced motion it just appears. */}
        <m.p
          key={`${tier}-${billing}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE }}
          className="flex items-baseline gap-1"
        >
          {price.kind === "custom" ? (
            <span className="font-heading text-[2.5rem] leading-none">
              Custom
            </span>
          ) : (
            <>
              <span className="font-heading text-[2.5rem] leading-none">
                {formatDollars(price.perMonth)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </>
          )}
        </m.p>
        <p className="mt-2 text-[13px] text-muted-foreground">
          {price.kind === "yearly"
            ? `${formatDollars(price.perYear)} billed once a year`
            : price.kind === "monthly"
              ? "Billed monthly"
              : "More than 10M events? Let's talk."}
        </p>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        <li className="flex items-start gap-3">
          <CheckIcon />
          {tier === CUSTOM_TIER ? "10M+" : `Up to ${events}`} monthly events
        </li>
        {plan.includes.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <CheckIcon />
            {item}
          </li>
        ))}
      </ul>

      {price.kind === "custom" ? (
        <a
          href={MAKER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${BUTTON_CLASSES.secondary} mt-8 w-full`}
        >
          Talk to us on X
        </a>
      ) : (
        <Link
          href={routes.signIn}
          className={cn(
            plan.id === "growth"
              ? BUTTON_CLASSES.primary
              : BUTTON_CLASSES.secondary,
            "mt-8 w-full"
          )}
        >
          Start tracking free
        </Link>
      )}
    </article>
  )
}

function CheckIcon() {
  return (
    <Check
      aria-hidden="true"
      strokeWidth={3}
      className="mt-0.5 size-5 shrink-0 text-positive"
    />
  )
}
