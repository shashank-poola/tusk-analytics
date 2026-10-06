import type { BreakdownBy } from "@workspace/contracts"
import { Fragment } from "react"

type BreakdownLabelProps = {
  by: BreakdownBy
  rowKey: string | null
  /** The display name from `keyLabel`. */
  name: string
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    // Not valid percent-encoding: show it as stored.
    return value
  }
}

/**
 * A row's name. Campaigns read like DataFast's: `?ref=` dimmed, the value
 * bright. Every part is tracker input, rendered as text.
 */
export function BreakdownLabel({ by, rowKey, name }: BreakdownLabelProps) {
  if (by !== "campaign" || !rowKey) {
    return (
      <span className="truncate" title={name}>
        {name}
      </span>
    )
  }
  const pairs = rowKey.split("&").map((pair) => {
    const [param = "", value = ""] = pair.split("=")
    return { param, value: decode(value) }
  })
  const full = `?${pairs.map(({ param, value }) => `${param}=${value}`).join("&")}`
  return (
    <span className="truncate" title={full}>
      {pairs.map(({ param, value }, index) => (
        <Fragment key={param}>
          <span className="text-muted-foreground">
            {index === 0 ? "?" : "&"}
            {param}=
          </span>
          {value}
        </Fragment>
      ))}
    </span>
  )
}
