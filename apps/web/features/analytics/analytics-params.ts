import { type StatsRange, statsRangeSchema } from "@workspace/contracts"
import * as z from "zod"

export const DEFAULT_RANGE: StatsRange = "7d"

export const RANGES = statsRangeSchema.options

/** For sentences: "in the last 7 days". */
export const RANGE_PERIODS: Record<StatsRange, string> = {
  "24h": "the last 24 hours",
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "90d": "the last 90 days",
}

/** The Devices card's sub-tab, in `?tab=`. */
const deviceTabSchema = z.enum(["device", "browser", "os"])
export type DeviceTab = z.infer<typeof deviceTabSchema>
export const DEFAULT_DEVICE_TAB: DeviceTab = "device"

type SearchParamValue = string | string[] | undefined

function first(value: SearchParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

/** `?range=`, or the default when it's missing or unknown. */
export function parseRange(value: SearchParamValue): StatsRange {
  const result = statsRangeSchema.safeParse(first(value))
  return result.success ? result.data : DEFAULT_RANGE
}

/** `?tab=` picks the Devices sub-tab; the default when missing or unknown. */
export function parseDeviceTab(value: SearchParamValue): DeviceTab {
  const result = deviceTabSchema.safeParse(first(value))
  return result.success ? result.data : DEFAULT_DEVICE_TAB
}
