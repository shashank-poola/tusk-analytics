import type { StatsGoalsResponse } from "@workspace/contracts"
import { Plus } from "lucide-react"

import { Menu } from "@/components/ui/menu"

import { formatCompact, formatNumber } from "@/features/analytics/utils/format"
import { goalColor } from "./goal-colors"
import { GoalsChart } from "./goals-chart"
import { InsightsControls } from "./insights-card"
import { SearchFilter } from "./search-filter"

const LIST_ID = "insights-goals"

/**
 * DataFast's Goal tab: lines over time on the left, every goal on the right
 * with its visitors, in the same colours. Goal names are tracker input,
 * rendered as text.
 */
export function GoalsView({ goals }: { goals: StatsGoalsResponse }) {
  const max = Math.max(1, ...goals.goals.map((goal) => goal.visitors))
  return (
    <>
      <InsightsControls>
        <SearchFilter
          label="Search goals"
          placeholder="Search goals"
          targetId={LIST_ID}
        />
        <GoalHelp />
      </InsightsControls>
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_20rem]">
        <div className="min-h-48">
          <GoalsChart goals={goals} />
        </div>
        <ul
          id={LIST_ID}
          aria-label="Goals"
          className="min-h-0 space-y-1 overflow-y-auto rounded-xl border border-border p-1.5"
        >
          {goals.goals.map((goal, index) => (
            <li
              key={goal.name}
              data-search={goal.name.toLowerCase()}
              className="relative flex h-9 items-center gap-2 rounded-md px-2.5 text-sm"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-md opacity-30"
                style={{
                  width: `${(goal.visitors / max) * 100}%`,
                  background: goalColor(index),
                }}
              />
              <span
                className="relative min-w-0 flex-1 truncate"
                title={goal.name}
              >
                {goal.name}
              </span>
              <span className="relative font-semibold tabular-nums">
                {formatCompact(goal.visitors)}
              </span>
              <span className="sr-only">
                {formatNumber(goal.visitors)} visitors,{" "}
                {formatNumber(goal.completions)} completions
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

const CODE_CLASSES =
  "block overflow-x-auto rounded-lg bg-background px-2.5 py-2 font-mono text-xs"

/** How to send goals: the "+" in DataFast's corner, as a how-to. */
export function GoalHelp() {
  return (
    <Menu
      label="How to track a goal"
      align="end"
      triggerClassName="size-11 justify-center rounded-lg px-0 sm:size-8"
      panelClassName="w-80"
      trigger={<Plus aria-hidden="true" className="size-4" />}
    >
      <div className="space-y-2 p-2 text-sm">
        <p className="font-semibold">Track a goal</p>
        <p className="text-muted-foreground">From your code:</p>
        <code className={CODE_CLASSES}>
          window.viewtally?.(&quot;signup&quot;)
        </code>
        <p className="text-muted-foreground">Or on any element people click:</p>
        <code className={CODE_CLASSES}>
          &lt;button data-vt-goal=&quot;signup&quot;&gt;
        </code>
        <p className="text-xs text-muted-foreground">
          Lowercase letters, digits, _ and -, up to 64 characters.
        </p>
      </div>
    </Menu>
  )
}
