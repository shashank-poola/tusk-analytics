import { cn } from "@workspace/ui/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import Link from "next/link"

import { Menu, MENU_ITEM_CLASSES } from "@/components/ui/menu"
import { routes } from "@/lib/routes"

import {
  getBreakdown,
  getFunnelStats,
  getGoals,
  getRecentVisitors,
} from "@/features/analytics/server/analytics.queries"
import { listFunnels } from "@/features/analytics/server/funnels.queries"
import {
  type DashboardView,
  viewSearch,
} from "@/features/analytics/utils/analytics-params"
import { NoData } from "@/features/analytics/components/empty-state"
import { CHIP_CLASSES } from "@/features/analytics/components/toolbar/chip"
import { DeleteFunnelButton } from "./delete-funnel-button"
import { FunnelChart } from "./funnel-chart"
import { GoalHelp, GoalsView } from "./goals-view"
import { InsightsControls } from "./insights-card"
import { NewFunnelDialog } from "./new-funnel-dialog"
import { UsersTable } from "./users-table"

type InsightsSectionProps = {
  siteId: string
  view: DashboardView
  /** "Last 30 days", for the funnel's conversion rate. */
  periodLabel: string
  now: Date
}

/** The open tab of the bottom card, each fetching only what it shows. */
export async function InsightsSection(props: InsightsSectionProps) {
  switch (props.view.insights) {
    case "user":
      return <UsersSection {...props} />
    case "goal":
      return <GoalsSection {...props} />
    case "funnel":
      return <FunnelSection {...props} />
  }
}

async function UsersSection({ siteId, view, now }: InsightsSectionProps) {
  const { visitors } = await getRecentVisitors(siteId, view)
  if (visitors.length === 0) return <NoData label="No visitors yet" />
  return <UsersTable visitors={visitors} now={now} />
}

async function GoalsSection({ siteId, view }: InsightsSectionProps) {
  const goals = await getGoals(siteId, view, view.interval)
  if (goals.goals.length > 0) return <GoalsView goals={goals} />
  return (
    <>
      <InsightsControls>
        <GoalHelp />
      </InsightsControls>
      <Empty
        title="No goals completed in this period"
        hint='Send one with window.viewtally?.("signup") or a data-vt-goal attribute: the + above shows how.'
      />
    </>
  )
}

const ICON_BUTTON_CLASSES =
  "inline-grid size-11 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:size-8"

async function FunnelSection({
  siteId,
  view,
  periodLabel,
}: InsightsSectionProps) {
  const [funnels, pages, goals] = await Promise.all([
    listFunnels(siteId),
    getBreakdown(siteId, view, "page"),
    getGoals(siteId, view, view.interval),
  ])
  const newFunnel = (
    <NewFunnelDialog
      siteId={siteId}
      pages={pages.rows.flatMap((row) => (row.key ? [row.key] : []))}
      goals={goals.goals.map((goal) => goal.name)}
      triggerClassName={CHIP_CLASSES}
    />
  )
  const selected =
    funnels.find((funnel) => funnel.id === view.funnel) ?? funnels[0]
  if (!selected) {
    return (
      <>
        <InsightsControls>{newFunnel}</InsightsControls>
        <Empty
          title="No funnels yet"
          hint="A funnel shows how many visitors get from one page or goal to the next, and where they drop off."
        />
      </>
    )
  }

  const { steps } = await getFunnelStats(siteId, view, selected.id)
  return (
    <>
      <InsightsControls>
        <Menu
          label={`Funnel: ${selected.name}`}
          align="end"
          triggerClassName="rounded-lg px-0 hover:bg-transparent"
          panelClassName="w-64"
          trigger={
            <span className={CHIP_CLASSES}>
              <span className="text-muted-foreground">Funnel:</span>
              <span className="max-w-32 truncate">{selected.name}</span>
              <ChevronDown
                aria-hidden="true"
                className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
              />
            </span>
          }
        >
          <ul>
            {funnels.map((funnel) => (
              <li key={funnel.id}>
                <Link
                  href={routes.site(
                    siteId,
                    viewSearch(view, { funnel: funnel.id })
                  )}
                  scroll={false}
                  aria-current={funnel.id === selected.id ? "page" : undefined}
                  className={MENU_ITEM_CLASSES}
                >
                  <span className="min-w-0 flex-1 truncate">{funnel.name}</span>
                  <Check
                    aria-hidden="true"
                    className={cn(
                      "size-4 text-accent",
                      funnel.id !== selected.id && "invisible"
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Menu>
        <DeleteFunnelButton
          siteId={siteId}
          funnel={selected}
          className={ICON_BUTTON_CLASSES}
        />
        {newFunnel}
      </InsightsControls>
      <FunnelChart
        periodLabel={periodLabel}
        steps={selected.steps.map((step, index) => ({
          ...step,
          visitors: steps[index]?.visitors ?? 0,
        }))}
      />
    </>
  )
}

function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="grid flex-1 place-items-center p-6 text-center">
      <div className="max-w-sm space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
    </div>
  )
}
