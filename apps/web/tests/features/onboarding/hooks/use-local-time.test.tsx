import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useLocalTime } from "@/features/onboarding/hooks/use-local-time"

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date("2026-10-08T12:18:00Z"))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useLocalTime", () => {
  it("shows the clock in the chosen time zone", () => {
    const { result } = renderHook(() => useLocalTime("Asia/Kolkata"))

    expect(result.current).toBe("5:48 PM")
  })

  it("follows a change of time zone", () => {
    const { result, rerender } = renderHook(({ zone }) => useLocalTime(zone), {
      initialProps: { zone: "Asia/Kolkata" },
    })

    rerender({ zone: "UTC" })

    expect(result.current).toBe("12:18 PM")
  })

  it("shows nothing for a zone the browser doesn't know", () => {
    const { result } = renderHook(() => useLocalTime("Mars/Olympus_Mons"))

    expect(result.current).toBeNull()
  })
})
