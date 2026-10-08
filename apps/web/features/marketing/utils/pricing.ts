// Tusk's prices by monthly events, about 40% under Plausible and DataFast
// (both start at $9 for 10k). Yearly is ten months' price: two free.

/** Monthly event tiers; past the last one, pricing is custom. */
export const EVENT_TIERS = [
  10_000, 100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
  10_000_000,
] as const

/** Index of "10M+" on the slider: one past the last tier. */
export const CUSTOM_TIER = EVENT_TIERS.length

export const YEARLY_MONTHS_CHARGED = 10

export type Billing = "monthly" | "yearly"

export type Plan = {
  id: "starter" | "growth"
  name: string
  /** Dollars a month, one per entry in EVENT_TIERS. */
  monthly: readonly number[]
  /** Only real limits and features: the API caps an account at 25 sites. */
  includes: readonly string[]
}

const EVERY_PLAN = [
  "Live count of who's online",
  "Referrers, pages, countries and devices",
  "Visitors with friendly names",
  "Goals and funnels",
] as const

export const PLANS: readonly Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: [5, 12, 19, 29, 45, 69, 99, 149],
    includes: ["1 website", ...EVERY_PLAN],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: [9, 16, 24, 36, 55, 79, 119, 179],
    includes: ["Up to 25 websites", ...EVERY_PLAN],
  },
]

/** 10_000 → "10k", 2_000_000 → "2M"; past the last tier, "10M+". */
export function eventsLabel(tier: number): string {
  const events = EVENT_TIERS[tier]
  if (events === undefined) return "10M+"
  return events >= 1_000_000 ? `${events / 1_000_000}M` : `${events / 1_000}k`
}

export type Price =
  | { kind: "custom" }
  | { kind: "monthly"; perMonth: number }
  | { kind: "yearly"; perMonth: number; perYear: number }

/** What a plan costs at a tier, billed monthly or yearly. */
export function planPrice(plan: Plan, tier: number, billing: Billing): Price {
  const monthly = plan.monthly[tier]
  if (monthly === undefined) return { kind: "custom" }
  if (billing === "monthly") return { kind: "monthly", perMonth: monthly }
  const perYear = monthly * YEARLY_MONTHS_CHARGED
  return { kind: "yearly", perMonth: perYear / 12, perYear }
}

/** 5 → "$5", 4.1666 → "$4.17". */
export function formatDollars(amount: number): string {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`
}
