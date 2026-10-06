import type {
  StatsBreakdownResponse,
  StatsOverviewResponse,
  StatsTotals,
} from "@workspace/contracts"

// Shared fixtures for the analytics component tests.

export const SITE = {
  id: "vt_3k9x2m7qpd4n8r1t",
  name: "My app",
  domain: "myapp.com",
  timezone: "UTC",
  createdAt: "2026-09-01T00:00:00.000Z",
}

export const NO_TOTALS: StatsTotals = {
  visitors: 0,
  pageviews: 0,
  sessions: 0,
  bounceRate: 0,
}

export function overview(
  current: StatsTotals,
  previous: StatsTotals = NO_TOTALS
): StatsOverviewResponse {
  return {
    range: {
      from: "2026-09-30T00:00:00.000Z",
      to: "2026-10-06T12:00:00.000Z",
      previousFrom: "2026-09-23T12:00:00.000Z",
      previousTo: "2026-09-30T00:00:00.000Z",
    },
    current,
    previous,
  }
}

/** `count` rows with visitors count, count - 1, …, 1. */
export function breakdown(
  by: StatsBreakdownResponse["by"],
  count: number
): StatsBreakdownResponse {
  return {
    by,
    rows: Array.from({ length: count }, (_, index) => ({
      key: `/page-${index + 1}`,
      visitors: count - index,
      pageviews: (count - index) * 3,
    })),
  }
}
