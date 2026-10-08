import { act, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { FirstVisitWatch } from "@/features/onboarding/components/first-visit-watch"

const { checkInstallStatus, refresh } = vi.hoisted(() => ({
  checkInstallStatus: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock("@/features/onboarding/server/install-status-action", () => ({
  checkInstallStatus,
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }))

const SITE_ID = "vt_3k9x2m7qpd4n8r1t"
const NOT_CONNECTED = { connected: false, firstEventAt: null } as const
const CONNECTED = {
  connected: true,
  firstEventAt: "2026-10-05T12:00:00.000Z",
} as const

function renderWatch() {
  return render(
    <FirstVisitWatch
      siteId={SITE_ID}
      domain="myapp.com"
      initialStatus={NOT_CONNECTED}
    />
  )
}

/** Advances fake time and lets the polled action's promise settle. */
async function wait(ms: number) {
  await act(() => vi.advanceTimersByTimeAsync(ms))
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  checkInstallStatus.mockReset()
  refresh.mockReset()
})

describe("FirstVisitWatch", () => {
  it("asks the owner to open their site while it waits", () => {
    renderWatch()

    expect(
      screen.getByRole("heading", { name: "Waiting for your first visitor" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Open myapp\.com/ })
    ).toHaveAttribute("href", "https://myapp.com")
  })

  it("celebrates the first visit, then loads the real dashboard", async () => {
    checkInstallStatus.mockResolvedValue(CONNECTED)
    renderWatch()

    await wait(3_000)
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your first visitor just showed up."
    )
    expect(refresh).not.toHaveBeenCalled()

    await wait(3_500)
    expect(refresh).toHaveBeenCalledOnce()
  })

  it("shows the checklist after a minute without a visit", async () => {
    checkInstallStatus.mockResolvedValue(NOT_CONNECTED)
    renderWatch()

    await wait(61_000)

    expect(screen.getByText(/No data yet\? Check that/)).toBeInTheDocument()
  })
})
