import {
  BREAKDOWN_MAX_LIMIT,
  breakdownBySchema,
  funnelIdSchema,
  siteIdSchema,
  statsFiltersSchema,
  statsIntervalSchema,
  statsRangeSchema,
  VISITORS_MAX_LIMIT,
} from "@workspace/contracts"
import * as z from "zod"

// Every tool is one read-only GET on /api/v1, so the API's own ownership
// checks and validation answer each call. Metric definitions: docs/metrics.md.

export type McpTool = {
  name: string
  title: string
  description: string
  inputSchema: z.ZodObject
  /** The /api/v1 path and query to read; throws a ZodError on bad arguments. */
  toPath: (args: unknown) => string
}

function defineTool<Schema extends z.ZodObject>(tool: {
  name: string
  title: string
  description: string
  input: Schema
  path: (args: z.output<Schema>) => string
}): McpTool {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.input,
    toPath: (args) => tool.path(tool.input.parse(args ?? {})),
  }
}

function withQuery(path: string, params: Record<string, unknown>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value))
  }
  const search = query.toString()
  return search ? `${path}?${search}` : path
}

const siteId = siteIdSchema.describe("The site's id, from list_sites")

const period = {
  site_id: siteId,
  range: statsRangeSchema
    .default("7d")
    .describe(
      "now = last 30 minutes; 24h, 7d, 30d, 90d, 12mo end now; today is the site's local day; custom needs from and to"
    ),
  from: z.iso.date().optional().describe("First day for custom, YYYY-MM-DD"),
  to: z.iso.date().optional().describe("Last day for custom, YYYY-MM-DD"),
  filters: statsFiltersSchema
    .optional()
    .describe(
      "Only count sessions that match all of these, e.g. { country: 'IN' }"
    ),
}

const periodInput = z.object(period)
type PeriodArgs = z.output<typeof periodInput>

function statsPath(
  { site_id, range, from, to, filters }: PeriodArgs,
  endpoint: string,
  extra: Record<string, unknown> = {}
): string {
  return withQuery(`/sites/${site_id}/stats/${endpoint}`, {
    range,
    from,
    to,
    ...filters,
    ...extra,
  })
}

export const MCP_TOOLS: McpTool[] = [
  defineTool({
    name: "list_sites",
    title: "List sites",
    description:
      "The sites in this Tusk account, with their ids, domains and time zones. Call this first to get a site_id.",
    input: z.object({}),
    path: () => "/sites",
  }),
  defineTool({
    name: "get_overview",
    title: "Overview",
    description:
      "Totals for a period with the previous period for comparison: visitors, sessions, pageviews, bounce rate, session duration.",
    input: periodInput,
    path: (args) => statsPath(args, "overview"),
  }),
  defineTool({
    name: "get_timeseries",
    title: "Visitors over time",
    description:
      "Visitors and pageviews per minute, hour, day, week or month across a period, with the top source of each bucket and the previous period's points for comparison.",
    input: periodInput.extend({ interval: statsIntervalSchema.optional() }),
    path: ({ interval, ...args }) =>
      statsPath(args, "timeseries", { interval }),
  }),
  defineTool({
    name: "get_breakdown",
    title: "Top sources, pages, countries…",
    description:
      "Visitors grouped by one dimension, most first: traffic source, channel, referrer, campaign, page, entry or exit page, country, region, city, device, browser, OS, hostname or outbound link.",
    input: periodInput.extend({
      by: breakdownBySchema,
      limit: z.number().int().min(1).max(BREAKDOWN_MAX_LIMIT).default(10),
    }),
    path: ({ by, limit, ...args }) =>
      statsPath(args, "breakdown", { by, limit }),
  }),
  defineTool({
    name: "get_live_visitors",
    title: "Live visitors",
    description: "How many visitors are on the site right now.",
    input: z.object({ site_id: siteId }),
    path: ({ site_id }) => `/sites/${site_id}/stats/live`,
  }),
  defineTool({
    name: "get_recent_visitors",
    title: "Recent visitors",
    description:
      "The latest visitors in a period, each with a pseudonymous id, location, device, browser, source, pageviews and last page. No names or emails: Tusk doesn't collect them.",
    input: periodInput.extend({
      limit: z.number().int().min(1).max(VISITORS_MAX_LIMIT).default(20),
    }),
    path: ({ limit, ...args }) => statsPath(args, "visitors", { limit }),
  }),
  defineTool({
    name: "get_goals",
    title: "Goals",
    description:
      "Goals (custom events such as signup) completed in a period, with visitors and completions per goal.",
    input: periodInput,
    path: (args) => statsPath(args, "goals"),
  }),
  defineTool({
    name: "list_funnels",
    title: "List funnels",
    description: "The funnels saved for a site, with their ids and steps.",
    input: z.object({ site_id: siteId }),
    path: ({ site_id }) => `/sites/${site_id}/funnels`,
  }),
  defineTool({
    name: "get_funnel",
    title: "Funnel conversion",
    description:
      "How many visitors reached each step of a saved funnel in a period, and where they dropped off.",
    input: periodInput.extend({
      funnel_id: funnelIdSchema.describe("The funnel's id, from list_funnels"),
    }),
    path: ({ funnel_id, ...args }) =>
      statsPath(args, "funnel", { funnel: funnel_id }),
  }),
]
