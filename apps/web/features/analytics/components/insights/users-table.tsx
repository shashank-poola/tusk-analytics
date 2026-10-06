import type { StatsVisitor } from "@workspace/contracts"
import { cn } from "@workspace/ui/lib/utils"

import { Avatar } from "@/components/ui/avatar"
import { Icon } from "@/components/ui/icon"
import { generatedAvatar } from "@/lib/avatar"

import { BreakdownIcon } from "@/features/analytics/components/breakdowns/breakdown-icon"
import { formatTimeAgo } from "@/features/analytics/utils/format"
import {
  browserLabel,
  countryLabel,
  deviceLabel,
  osLabel,
  sourceLabel,
} from "@/features/analytics/utils/labels"
import { visitorName } from "@/features/analytics/utils/visitor-name"
import { InsightsControls } from "./insights-card"
import { SearchFilter } from "./search-filter"

const TABLE_ID = "insights-users"

type UsersTableProps = {
  visitors: StatsVisitor[]
  /** When the page rendered; "5 minutes ago" is relative to it. */
  now: Date
}

/**
 * Who visited lately, latest first, as on DataFast's User tab: a generated
 * face and nickname, where and on what, where from, and the last week's
 * activity as dots. The API sends a site-scoped pseudonym, not the
 * tracker's cookie id; it seeds the face and nickname. Every text value is
 * tracker input, shown as text.
 */
export function UsersTable({ visitors, now }: UsersTableProps) {
  return (
    <>
      <InsightsControls>
        <SearchFilter
          label="Search visitors"
          placeholder="Search"
          targetId={TABLE_ID}
        />
      </InsightsControls>
      <div id={TABLE_ID} className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="sticky top-0 z-10 bg-surface text-left text-xs font-semibold text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">
                Visitor
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Source
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Last seen
              </th>
            </tr>
          </thead>
          <tbody>
            {visitors.map((visitor) => (
              <UserRow key={visitor.id} visitor={visitor} now={now} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function UserRow({ visitor, now }: { visitor: StatsVisitor; now: Date }) {
  const name = visitorName(visitor.id)
  const country = countryLabel(visitor.country)
  const device = deviceLabel(visitor.device)
  const os = visitor.os && osLabel(visitor.os)
  const browser = visitor.browser && browserLabel(visitor.browser)
  const source = sourceLabel(visitor.source)
  const search = [name, country, device, os, browser, source]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
  return (
    <tr data-search={search} className="transition-colors hover:bg-muted/40">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-3">
          <Avatar
            src={generatedAvatar(visitor.id)}
            className="size-11 ring-2 ring-surface"
          />
          <div className="min-w-0">
            <p className="font-semibold">{name}</p>
            <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
              <Detail
                icon={
                  <Icon
                    type="country"
                    name={visitor.country}
                    className="size-4"
                  />
                }
              >
                {country}
              </Detail>
              <Detail
                icon={
                  <Icon
                    type="device"
                    name={visitor.device}
                    className="size-4"
                  />
                }
              >
                {device}
              </Detail>
              {os && visitor.os && (
                <Detail
                  icon={<Icon type="os" name={visitor.os} className="size-4" />}
                >
                  {os}
                </Detail>
              )}
              {browser && visitor.browser && (
                <Detail
                  icon={
                    <Icon
                      type="browser"
                      name={visitor.browser}
                      className="size-4"
                    />
                  }
                >
                  {browser}
                </Detail>
              )}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-2">
          <BreakdownIcon by="source" rowKey={visitor.source} />
          <span className="max-w-[12rem] truncate">{source}</span>
        </span>
      </td>
      <td className="px-3 py-2.5">
        <time dateTime={visitor.lastSeenAt} title={`On ${visitor.lastPage}`}>
          {formatTimeAgo(visitor.lastSeenAt, now)}
        </time>
        <ActivityDots days={visitor.activeDays} />
      </td>
    </tr>
  )
}

function Detail({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1">
      {icon}
      <span className="max-w-[10rem] truncate">{children}</span>
    </span>
  )
}

/** The last 7 days, oldest first: a filled dot for each day with a visit. */
function ActivityDots({ days }: { days: boolean[] }) {
  const active = days.filter(Boolean).length
  return (
    <span className="mt-1 flex gap-1">
      {days.map((visited, index) => (
        <span
          // Fixed length and order: the index is the day.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          aria-hidden="true"
          className={cn(
            "size-2 rounded-full border",
            visited ? "border-chart-1 bg-chart-1" : "border-muted-foreground/40"
          )}
        />
      ))}
      <span className="sr-only">Visited on {active} of the last 7 days</span>
    </span>
  )
}
