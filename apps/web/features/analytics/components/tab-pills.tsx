import { TAB_TRACK_CLASSES, tabClasses } from "@/components/ui/tab-styles"
import { ViewLink } from "@/features/analytics/components/view-link"

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
