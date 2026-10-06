import type { BreakdownBy } from "@workspace/contracts"

// The four breakdown cards and their tabs. Each card keeps its open tab in
// its own search param (`?sources=campaign`), so every view is shareable
// and server-rendered.

export type BreakdownTab = {
  /** The tab's value in the URL. */
  id: string
  label: string
  /** The dimension its rows count. */
  by: BreakdownBy
  /** Drawn as a chart instead of rows. */
  chart?: "donut" | "map"
}

type CardSpec = {
  tabs: readonly [BreakdownTab, ...BreakdownTab[]]
  defaultTab: string
}

export const BREAKDOWN_CARDS = {
  sources: {
    tabs: [
      { id: "channel", label: "Channel", by: "channel", chart: "donut" },
      // DataFast's "Referrer": the named source (Google, X, a hostname).
      { id: "referrer", label: "Referrer", by: "source" },
      { id: "campaign", label: "Campaign", by: "campaign" },
    ],
    defaultTab: "referrer",
  },
  pages: {
    tabs: [
      { id: "hostname", label: "Hostname", by: "hostname" },
      { id: "page", label: "Page", by: "page" },
      { id: "entry_page", label: "Entry page", by: "entry_page" },
      { id: "exit_link", label: "Exit link", by: "exit_link" },
    ],
    defaultTab: "page",
  },
  locations: {
    tabs: [
      { id: "map", label: "Map", by: "country", chart: "map" },
      { id: "country", label: "Country", by: "country" },
      { id: "region", label: "Region", by: "region" },
      { id: "city", label: "City", by: "city" },
    ],
    defaultTab: "map",
  },
  devices: {
    tabs: [
      { id: "browser", label: "Browser", by: "browser" },
      { id: "os", label: "OS", by: "os" },
      { id: "device", label: "Device", by: "device" },
    ],
    defaultTab: "browser",
  },
} as const satisfies Record<string, CardSpec>

export type BreakdownCardKey = keyof typeof BREAKDOWN_CARDS
export const BREAKDOWN_CARD_KEYS = [
  "sources",
  "pages",
  "locations",
  "devices",
] as const satisfies readonly BreakdownCardKey[]

/** The open tab of each card, by id, as kept in the URL. */
export type BreakdownTabs = Record<BreakdownCardKey, string>

/** The card's tab with `id`, or its default tab. */
export function cardTab(card: BreakdownCardKey, id: string): BreakdownTab {
  const { tabs, defaultTab } = BREAKDOWN_CARDS[card]
  const all: readonly BreakdownTab[] = tabs
  return (
    all.find((tab) => tab.id === id) ??
    all.find((tab) => tab.id === defaultTab) ??
    tabs[0]
  )
}

type SearchParamValue = string | string[] | undefined

/** Each card's tab from its param; the card's default when missing or unknown. */
export function parseBreakdownTabs(
  search: Record<string, SearchParamValue>
): BreakdownTabs {
  const tabOf = (card: BreakdownCardKey) => {
    const value = search[card]
    return cardTab(card, (Array.isArray(value) ? value[0] : value) ?? "").id
  }
  return {
    sources: tabOf("sources"),
    pages: tabOf("pages"),
    locations: tabOf("locations"),
    devices: tabOf("devices"),
  }
}
