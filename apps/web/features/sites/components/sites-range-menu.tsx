"use client"

import { cn } from "@workspace/ui/lib/utils"
import { Check, ChevronDown } from "lucide-react"
import { useRef, useTransition } from "react"

import { Menu } from "@/components/ui/menu"
import { MENU_ITEM_CLASSES } from "@/components/ui/menu-styles"

import { setSitesRangeAction } from "@/features/sites/server/sites-range-action"
import {
  SITES_RANGE_LABELS,
  SITES_RANGES,
  type SitesRange,
} from "@/features/sites/utils/sites-range"

/** "last 24 hours ⌄" inside the greeting, dotted like a link, as on DataFast. */
export function SitesRangeMenu({ range }: { range: SitesRange }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pending, startTransition] = useTransition()
  return (
    <Menu
      label={`Period: ${SITES_RANGE_LABELS[range]}`}
      triggerClassName="inline-flex min-h-0 gap-1 rounded-md px-0.5 hover:bg-transparent sm:min-h-0"
      panelClassName="w-48"
      className="inline-block align-baseline"
      trigger={
        <>
          <span
            className={cn(
              "border-b border-dashed border-muted-foreground/60 font-semibold text-foreground",
              pending && "opacity-60"
            )}
          >
            {SITES_RANGE_LABELS[range]}
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-3.5 text-muted-foreground transition-transform group-open:rotate-180"
          />
        </>
      }
    >
      <div ref={ref}>
        <ul>
          {SITES_RANGES.map((option) => (
            <li key={option}>
              <button
                type="button"
                aria-pressed={option === range}
                onClick={() => {
                  const menu = ref.current?.closest("details")
                  if (menu) menu.open = false
                  startTransition(() => setSitesRangeAction(option))
                }}
                className={cn(MENU_ITEM_CLASSES, "text-base sm:text-sm")}
              >
                <span className="flex-1 first-letter:uppercase">
                  {SITES_RANGE_LABELS[option]}
                </span>
                <Check
                  aria-hidden="true"
                  className={cn(
                    "size-4 text-accent",
                    option !== range && "invisible"
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Menu>
  )
}
