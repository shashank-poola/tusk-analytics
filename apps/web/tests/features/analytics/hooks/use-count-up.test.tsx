import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  COUNT_UP_MS,
  useCountUp,
} from "@/features/analytics/hooks/use-count-up"

import { stubMatchMedia } from "@/tests/setup"

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "performance"] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("useCountUp", () => {
  it("shows the final number at once when reduced motion is on", () => {
    stubMatchMedia(true)
    const requestFrame = vi.spyOn(window, "requestAnimationFrame")

    const { result } = renderHook(() => useCountUp(1200))

    expect(result.current).toBe(1200)
    expect(requestFrame).not.toHaveBeenCalled()
  })

  it("counts up from zero and lands on the number", async () => {
    stubMatchMedia(false)

    const { result } = renderHook(() => useCountUp(1200))
    await act(() => vi.advanceTimersByTimeAsync(COUNT_UP_MS / 3))
    expect(result.current).toBeGreaterThan(0)
    expect(result.current).toBeLessThan(1200)

    await act(() => vi.advanceTimersByTimeAsync(COUNT_UP_MS))
    expect(result.current).toBe(1200)
  })

  it("shows a changed number at once instead of counting again", async () => {
    stubMatchMedia(false)
    const { result, rerender } = renderHook(
      ({ target }) => useCountUp(target),
      {
        initialProps: { target: 10 },
      }
    )
    await act(() => vi.advanceTimersByTimeAsync(COUNT_UP_MS * 2))

    rerender({ target: 500 })
    expect(result.current).toBe(500)
  })
})
