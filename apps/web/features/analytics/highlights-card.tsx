import { Activity, FileText, type LucideIcon, Trophy } from "lucide-react"

import { Card } from "@/components/dashboard/card"

import type { Highlight } from "./highlights"

const ICONS: Record<Highlight["kind"], LucideIcon> = {
  source: Trophy,
  page: FileText,
  change: Activity,
}

/** Up to three plain sentences. Renders nothing when none are true yet. */
export function HighlightsCard({ highlights }: { highlights: Highlight[] }) {
  if (highlights.length === 0) return null
  return (
    <Card aria-labelledby="highlights-heading" className="p-5">
      <h2
        id="highlights-heading"
        className="text-sm font-medium text-muted-foreground"
      >
        Highlights
      </h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-3">
        {highlights.map(({ kind, text }) => {
          const Icon = ICONS[kind]
          return (
            <li key={kind} className="flex gap-3 text-sm">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="pt-1.5">{text}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
