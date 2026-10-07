import { cn } from "@workspace/ui/lib/utils"
import { ViewLink } from "@/features/analytics/components/view-link"

/** The track and its pills; shared with the landing page demo. */
export const TAB_TRACK_CLASSES = "inline-flex gap-0.5 rounded-xl bg-muted p-1"

export function tabClasses(active: boolean): string {
  return cn(
    "inline-flex h-11 items-center rounded-lg px-3 text-[0.8125rem] font-medium whitespace-nowrap transition-colors sm:h-7",
    active
      ? "bg-surface text-foreground shadow-card"
      : "text-muted-foreground hover:text-foreground"
  )
}

type TabPillsProps = {
  /** Accessible name of the tab list, e.g. "sources breakdown". */
  label: string
  tabs: { id: string; label: string; href: string }[]
  active: string
}

/**
 * DataFast's tab switcher: pills on a darker track, the open one raised.
 * Plain links, so tabs live in the URL and work before hydration.
 */
export function TabPills({ label, tabs, active }: TabPillsProps) {
  return (
    <nav aria-label={label} className="min-w-0 overflow-x-auto">
      <ul className={TAB_TRACK_CLASSES}>
        {tabs.map((tab) => (
          <li key={tab.id}>
            <ViewLink
              href={tab.href}
              scroll={false}
              aria-current={tab.id === active ? "page" : undefined}
              className={tabClasses(tab.id === active)}
            >
              {tab.label}
            </ViewLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
