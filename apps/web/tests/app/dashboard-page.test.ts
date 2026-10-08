import { describe, expect, it, vi } from "vitest"

import DashboardPage from "@/app/(dashboard)/dashboard/page"

const { listSites, findInstallStatus, redirect } = vi.hoisted(() => ({
  listSites: vi.fn(),
  findInstallStatus: vi.fn(),
  // Like the real one, redirect() throws to stop rendering.
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`)
  }),
}))

vi.mock("@/features/sites/server/sites.queries", () => ({
  listSites,
  findInstallStatus,
}))
vi.mock("next/navigation", () => ({ redirect }))

const SITE = { id: "vt_3k9x2m7qpd4n8r1t" }

describe("dashboard entry: resuming onboarding", () => {
  it("starts onboarding when there's no site yet", async () => {
    listSites.mockResolvedValue([])

    await expect(DashboardPage()).rejects.toThrow("redirect:/onboarding")
  })

  it("goes back to the install step when the newest site has no visits", async () => {
    listSites.mockResolvedValue([SITE])
    findInstallStatus.mockResolvedValue({
      connected: false,
      firstEventAt: null,
    })

    await expect(DashboardPage()).rejects.toThrow(
      `redirect:/onboarding/${SITE.id}`
    )
  })

  it("opens the site's page, not the install step, when the status check fails", async () => {
    listSites.mockResolvedValue([SITE])
    findInstallStatus.mockResolvedValue(null)

    await expect(DashboardPage()).rejects.toThrow(`redirect:/site/${SITE.id}`)
  })

  it("opens the site's dashboard once it has visits", async () => {
    listSites.mockResolvedValue([SITE])
    findInstallStatus.mockResolvedValue({
      connected: true,
      firstEventAt: "2026-10-05T12:00:00.000Z",
    })

    await expect(DashboardPage()).rejects.toThrow(`redirect:/site/${SITE.id}`)
  })
})
