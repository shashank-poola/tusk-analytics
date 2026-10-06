import type { StatsOverviewResponse, StatsRange } from "@workspace/contracts"

import { greetingDetail, greetingHeadline } from "./greeting-text"

type GreetingProps = {
  name: string | null
  domain: string
  range: StatsRange
  overview: StatsOverviewResponse
  /**
   * Layout slot for the "Visitors now" pill, filled in step 4B. Leave it
   * empty until there is real live data: never fake it.
   */
  visitorsNow?: React.ReactNode
}

/** The page's headline: what happened, in one warm sentence. */
export function Greeting({
  name,
  domain,
  range,
  overview: { current, previous },
  visitorsNow,
}: GreetingProps) {
  const headline = greetingHeadline({
    name,
    domain,
    range,
    visitors: current.visitors,
  })
  // Browsers break lines after hyphens; never split the domain.
  const [before, ...after] = headline.split(domain)
  return (
    <div className="animate-rise space-y-2">
      <h1 className="max-w-3xl text-2xl font-normal tracking-tight text-balance sm:text-3xl">
        {before}
        <span className="whitespace-nowrap">{domain}</span>
        {after.join(domain)}
      </h1>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-sm text-muted-foreground">
          {greetingDetail(range, current, previous)}
        </p>
        {visitorsNow}
      </div>
    </div>
  )
}
