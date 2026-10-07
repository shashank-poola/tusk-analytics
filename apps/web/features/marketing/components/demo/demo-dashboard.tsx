import { ChevronDown, ChevronLeft, ChevronRight, RotateCw } from "lucide-react"

import { Logo, LogoMark } from "@/components/brand/logo"
import { Avatar } from "@/components/ui/avatar"
import { generatedAvatar } from "@/lib/avatar"

import { CHIP_CLASSES } from "@/features/analytics/components/toolbar/chip"
import { DEMO_CARDS, DEMO_SITE } from "@/features/marketing/utils/demo-data"
import { DemoBreakdown, DemoOverviewCard } from "./demo-cards"

/**
 * The real dashboard, filled with sample data for usetusk.dev, in a plain
 * window frame the size of a browser window, scrolling inside: same cards,
 * chart, rows and icons as the app. Tabs switch and the chart answers
 * hover; nothing reaches the API.
 */
export function DemoDashboard() {
  return (
    <figure
      aria-label={`Demo dashboard for ${DEMO_SITE}, with sample data`}
      className="m-0 flex h-[40rem] flex-col overflow-hidden rounded-[1.25rem] border-2 border-border bg-background text-left sm:h-[50rem]"
    >
      <WindowBar />
      {/* A window, not a page: the dashboard scrolls inside it. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Demo dashboard, scrollable"
        className="min-h-0 flex-1 [scrollbar-width:thin] overflow-y-auto overscroll-contain"
      >
        {/* Zoomed out a step, like a dashboard seen in a real browser. */}
        <div className="space-y-4 p-3 sm:[zoom:0.9] sm:space-y-5 sm:p-6">
          <div className="flex items-center justify-between">
            <Logo className="hidden sm:inline-flex" />
            <LogoMark className="size-10 sm:hidden" />
            <Avatar
              src={generatedAvatar("usetusk-demo-owner")}
              className="size-9"
            />
          </div>

          <Toolbar />

          <DemoOverviewCard />

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
            {DEMO_CARDS.map((card) => (
              <DemoBreakdown key={card.label} card={card.label} />
            ))}
          </div>
        </div>
      </div>
    </figure>
  )
}

/** A flat window top: three dots and the address. */
function WindowBar() {
  return (
    <div className="flex h-11 items-center gap-3 border-b-2 border-border bg-section-alt px-4">
      <span aria-hidden="true" className="flex gap-1.5">
        <span className="size-3 rounded-full bg-window-close" />
        <span className="size-3 rounded-full bg-window-minimize" />
        <span className="size-3 rounded-full bg-window-zoom" />
      </span>
      <span className="mx-auto rounded-lg bg-background px-4 py-1 text-[13px] text-muted-foreground">
        {DEMO_SITE}/dashboard
      </span>
      <span aria-hidden="true" className="w-[3.25rem]" />
    </div>
  )
}

/** The dashboard's filter row, drawn as it looks; the demo has one view. */
function Toolbar() {
  return (
    <div aria-hidden="true" className="flex flex-wrap items-center gap-2">
      <span className={CHIP_CLASSES}>
        <LogoMark className="size-5" />
        {DEMO_SITE}
        <ChevronDown className="size-4 text-muted-foreground" />
      </span>
      <span className={`${CHIP_CLASSES} gap-0 px-0`}>
        <ChevronLeft className="mx-2 size-4 text-muted-foreground" />
        <span className="border-x-2 border-border px-3">Last 30 days</span>
        <ChevronRight className="mx-2 size-4 text-muted-foreground/40" />
      </span>
      <span className={`${CHIP_CLASSES} max-sm:hidden`}>
        Daily
        <ChevronDown className="size-4 text-muted-foreground" />
      </span>
      <span className={`${CHIP_CLASSES} max-sm:hidden`}>
        <RotateCw className="size-4" />
      </span>
    </div>
  )
}
