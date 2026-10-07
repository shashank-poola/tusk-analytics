import { act, render, screen } from "@testing-library/react"
import type { InstallStatus } from "@workspace/contracts"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VerifyInstallation } from "@/features/onboarding/components/verify-installation"

const { checkInstallStatus } = vi.hoisted(() => ({
  checkInstallStatus: vi.fn(),
}))

vi.mock("@/features/onboarding/server/install-status-action", () => ({
  checkInstallStatus,
}))

const SITE_ID = "vt_3k9x2m7qpd4n8r1t"
const NOT_CONNECTED = { connected: false, firstEventAt: null } as const
const CONNECTED = {
  connected: true,
  firstEventAt: "2026-10-05T12:00:00.000Z",
} as const

function renderPanel(initialStatus: InstallStatus = NOT_CONNECTED) {
  return render(
    <VerifyInstallation
      siteId={SITE_ID}
      domain="myapp.com"
      initialStatus={initialStatus}
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
})

describe("VerifyInstallation", () => {
  it("polls every 3 seconds and shows success once connected", async () => {
    checkInstallStatus
      .mockResolvedValueOnce(NOT_CONNECTED)
      .mockResolvedValueOnce(CONNECTED)
    renderPanel()
    expect(screen.getByText("Waiting for the first visit")).toBeInTheDocument()

    await wait(3_000)
    expect(checkInstallStatus).toHaveBeenCalledWith(SITE_ID)
    expect(screen.queryByRole("status")).not.toBeInTheDocument()

    await wait(3_000)
    expect(screen.getByRole("status")).toHaveTextContent(
      "Your first visitor just showed up."
    )
    expect(
      screen.getByRole("link", { name: "View analytics" })
    ).toHaveAttribute("href", `/site/${SITE_ID}`)

    await wait(30_000)
    expect(checkInstallStatus).toHaveBeenCalledTimes(2)
  })

  it("shows the troubleshooting checklist after 60 seconds without data", async () => {
    checkInstallStatus.mockResolvedValue(NOT_CONNECTED)
    renderPanel()

    await wait(57_000)
    expect(screen.queryByText(/No data yet/)).not.toBeInTheDocument()

    await wait(3_000)
    expect(screen.getByText(/No data yet/)).toBeInTheDocument()
    expect(screen.getByText(/inside the <head>/)).toBeInTheDocument()
    expect(
      screen.getByText(/myapp\.com or www\.myapp\.com/)
    ).toBeInTheDocument()
    expect(screen.getByText(/ad blocker/)).toBeInTheDocument()
    expect(screen.getByText(/Hard refresh/)).toBeInTheDocument()
  })

  it("stops polling after 5 minutes", async () => {
    checkInstallStatus.mockResolvedValue(NOT_CONNECTED)
    renderPanel()

    await wait(5 * 60_000)
    const calls = checkInstallStatus.mock.calls.length
    await wait(60_000)

    expect(calls).toBe(100)
    expect(checkInstallStatus).toHaveBeenCalledTimes(calls)
    expect(screen.getByText(/stopped checking/)).toBeInTheDocument()
  })

  it("keeps polling after a failed check", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    checkInstallStatus
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(CONNECTED)
    renderPanel()

    await wait(6_000)

    expect(screen.getByRole("status")).toHaveTextContent(
      "Your first visitor just showed up."
    )
  })

  it("celebrates with Tusk jumping when the status flips", async () => {
    checkInstallStatus.mockResolvedValueOnce(CONNECTED)
    const { container } = renderPanel()

    await wait(3_000)

    expect(container.querySelectorAll("img.animate-jump")).toHaveLength(1)
  })

  it("doesn't replay the celebration when the page loads already connected", () => {
    const { container } = renderPanel(CONNECTED)

    expect(screen.getByRole("status")).toHaveTextContent("Connected")
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Your first visitor just showed up."
    )
    expect(container.querySelector(".animate-jump")).toBeNull()
  })

  it("doesn't poll when the site is already connected", async () => {
    renderPanel(CONNECTED)

    await wait(10_000)

    expect(screen.getByRole("status")).toHaveTextContent("Connected")
    expect(checkInstallStatus).not.toHaveBeenCalled()
  })
})
