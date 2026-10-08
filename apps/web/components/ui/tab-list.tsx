"use client"

import { cn } from "@workspace/ui/lib/utils"
import type { LucideIcon } from "lucide-react"
import { useRef } from "react"

import { TAB_TRACK_CLASSES, tabClasses } from "./tab-styles"

export type TabItem = {
  id: string
  label: string
  icon?: LucideIcon
  /** A brand logo instead of an icon; `invertInDark` for black logos. */
  logo?: { src: string; invertInDark?: boolean }
}

type TabListProps = {
  /** Names the list, e.g. "How to install". */
  label: string
  tabs: readonly TabItem[]
  active: string
  onChange: (id: string) => void
  /** From useId(): tabs get `${idPrefix}-${id}`, the panel `${idPrefix}-panel`. */
  idPrefix: string
  /** Tabs share the full width equally, like a segmented control. */
  stretch?: boolean
}

const MOVES: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_, count) => count - 1,
}

/**
 * Tabs that switch in place, following the WAI-ARIA pattern: one tab
 * stop, arrow keys move and select, Home and End jump to the ends.
 * Render the panel with `role="tabpanel"`, `id={`${idPrefix}-panel`}` and
 * `tabIndex={0}`.
 */
export function TabList({
  label,
  tabs,
  active,
  onChange,
  idPrefix,
  stretch = false,
}: TabListProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const move = MOVES[event.key]
    if (!move) return
    event.preventDefault()
    const next = move(index, tabs.length)
    const tab = tabs[next]
    if (!tab) return
    onChange(tab.id)
    buttons.current[next]?.focus()
  }

  return (
    <div className="min-w-0 overflow-x-auto">
      <div
        role="tablist"
        aria-label={label}
        className={cn(
          TAB_TRACK_CLASSES,
          stretch && "grid w-full auto-cols-fr grid-flow-col"
        )}
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              ref={(node) => {
                buttons.current[index] = node
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                tabClasses(selected),
                (tab.icon || tab.logo) && "gap-1.5",
                stretch && "justify-center"
              )}
            >
              {tab.icon && <tab.icon aria-hidden="true" className="size-3.5" />}
              {tab.logo && (
                // eslint-disable-next-line @next/next/no-img-element -- small static SVG
                <img
                  src={tab.logo.src}
                  alt=""
                  width={14}
                  height={14}
                  className={cn(
                    "size-3.5",
                    tab.logo.invertInDark && "dark:invert"
                  )}
                />
              )}
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
