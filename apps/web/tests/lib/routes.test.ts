import { describe, expect, it } from "vitest"

import { routes } from "@/lib/routes"

describe("routes", () => {
  it("opens a site as the visitor left it, with a clean URL", () => {
    expect(routes.site("vt_x")).toBe("/site/vt_x")
  })

  it("marks every link that sets the view, even to the defaults", () => {
    expect(routes.site("vt_x", {})).toBe("/site/vt_x?view=1")
    expect(routes.site("vt_x", { range: "30d", country: undefined })).toBe(
      "/site/vt_x?view=1&range=30d"
    )
  })

  it("keeps /sites for the list of all sites", () => {
    expect(routes.sites).toBe("/sites")
  })
})
