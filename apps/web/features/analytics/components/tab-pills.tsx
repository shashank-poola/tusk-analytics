import { cn } from "@workspace/ui/lib/utils"
import Link from "next/link"

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
      <ul className="inline-flex gap-0.5 rounded-xl bg-background p-1">
        {tabs.map((tab) => (
          <li key={tab.id}>
            <Link
              href={tab.href}
              scroll={false}
              aria-current={tab.id === active ? "page" : undefined}
              className={cn(
                "inline-flex h-11 items-center rounded-lg px-3 text-[0.8125rem] font-medium whitespace-nowrap transition-colors sm:h-7",
                tab.id === active
                  ? "bg-surface text-foreground shadow-card dark:bg-muted"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
