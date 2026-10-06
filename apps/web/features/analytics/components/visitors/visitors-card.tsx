import type { StatsVisitor } from "@workspace/contracts"

import { Avatar } from "@/components/ui/avatar"
import { Card, FIXED_CARD_HEIGHT } from "@/components/ui/card"
import { Icon } from "@/components/ui/icon"
import { generatedAvatar } from "@/lib/avatar"

import { BreakdownIcon } from "@/features/analytics/components/breakdowns/breakdown-icon"
import { formatNumber, formatTimeAgo } from "@/features/analytics/utils/format"
import {
  browserLabel,
  countryLabel,
  deviceLabel,
  osLabel,
  sourceLabel,
} from "@/features/analytics/utils/labels"
import { visitorName } from "@/features/analytics/utils/visitor-name"

/** The list's frame, the same fixed height as the breakdown cards. */
export function VisitorsCard({ children }: { children: React.ReactNode }) {
  return (
    <Card
      aria-labelledby="visitors-heading"
      className={`flex ${FIXED_CARD_HEIGHT} flex-col p-2 sm:p-2.5`}
    >
      <div className="flex min-h-11 items-center justify-between px-3">
        <h2 id="visitors-heading" className="font-semibold">
          Recent visitors
        </h2>
        <span className="text-xs text-muted-foreground">Latest first</span>
      </div>
      <div className="mt-1 flex min-h-0 flex-1 flex-col">{children}</div>
    </Card>
  )
}

type VisitorsListProps = {
  visitors: StatsVisitor[]
  /** When the page rendered; "5 minutes ago" is relative to it. */
  now: Date
}

/**
 * Who visited lately, latest first, each with a generated face and nickname.
 * The API sends a site-scoped pseudonym, not the tracker's cookie id; it
 * seeds the face and nickname. Every text value is tracker input, shown as
 * text.
 */
export function VisitorsList({ visitors, now }: VisitorsListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="sticky top-0 z-10 bg-surface text-left text-xs font-semibold text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">
              Visitor
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Source
            </th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">
              Pages
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Last seen
            </th>
          </tr>
        </thead>
        <tbody>
          {visitors.map((visitor) => (
            <VisitorRow key={visitor.id} visitor={visitor} now={now} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function VisitorRow({ visitor, now }: { visitor: StatsVisitor; now: Date }) {
  const place = [visitor.city, countryLabel(visitor.country)]
    .filter(Boolean)
    .join(", ")
  return (
    <tr className="border-t border-border transition-colors hover:bg-muted/50">
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <Avatar
            src={generatedAvatar(visitor.id)}
            className="size-10 ring-2 ring-surface"
          />
          <div className="min-w-0">
            <p className="font-medium">{visitorName(visitor.id)}</p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Icon type="country" name={visitor.country} />
                <span className="max-w-[12rem] truncate">{place}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Icon type="device" name={visitor.device} />
                {deviceLabel(visitor.device)}
              </span>
              {visitor.os && <span>{osLabel(visitor.os)}</span>}
              {visitor.browser && <span>{browserLabel(visitor.browser)}</span>}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <span className="inline-flex items-center gap-2">
          <BreakdownIcon by="source" rowKey={visitor.source} />
          <span className="max-w-[10rem] truncate">
            {sourceLabel(visitor.source)}
          </span>
        </span>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        <span className="font-semibold">{formatNumber(visitor.pageviews)}</span>
        <span className="block text-xs text-muted-foreground">
          {visitor.sessions === 1
            ? "1 visit"
            : `${formatNumber(visitor.sessions)} visits`}
        </span>
      </td>
      <td className="px-3 py-3">
        <time dateTime={visitor.lastSeenAt}>
          {formatTimeAgo(visitor.lastSeenAt, now)}
        </time>
        <span
          className="block max-w-[14rem] truncate text-xs text-muted-foreground"
          title={visitor.lastPage}
        >
          on {visitor.lastPage}
        </span>
      </td>
    </tr>
  )
}
