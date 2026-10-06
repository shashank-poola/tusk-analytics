import { fireEvent, render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Icon } from "@/components/ui/icon"

function srcOf(element: React.ReactElement) {
  const { container } = render(element)
  const img = container.querySelector("img")
  if (!img) throw new Error("No img rendered")
  return { img, src: img.getAttribute("src") }
}

describe("Icon", () => {
  it("builds the static path from the type and the slug", () => {
    expect(srcOf(<Icon type="browser" name="chrome" />).src).toBe(
      "/icons/browsers/chrome.svg"
    )
    expect(srcOf(<Icon type="os" name="macos" />).src).toBe(
      "/icons/os/macos.svg"
    )
    expect(srcOf(<Icon type="device" name="mobile" />).src).toBe(
      "/icons/devices/mobile.svg"
    )
    expect(srcOf(<Icon type="country" name="IN" />).src).toBe(
      "/icons/flags/in.svg"
    )
  })

  it("uses the local logo for a known source or any of its hostnames", () => {
    expect(srcOf(<Icon type="referrer" name="x" />).src).toBe(
      "/icons/referrers/x.svg"
    )
    expect(srcOf(<Icon type="referrer" name="l.facebook.com" />).src).toBe(
      "/icons/referrers/facebook.svg"
    )
  })

  it("asks Google for the favicon of an unknown domain", () => {
    expect(srcOf(<Icon type="referrer" name="blog.example.org" />).src).toBe(
      "https://www.google.com/s2/favicons?domain=blog.example.org&sz=32"
    )
  })

  it("never puts a name that isn't a slug or hostname into a url", () => {
    expect(srcOf(<Icon type="browser" name="../../etc" />).src).toBe(
      "/icons/generic.svg"
    )
    expect(srcOf(<Icon type="country" name={null} />).src).toBe(
      "/icons/generic.svg"
    )
    expect(srcOf(<Icon type="referrer" name="newsletter" />).src).toBe(
      "/icons/generic-link.svg"
    )
  })

  it("falls back to a generic icon when the file fails to load", () => {
    const { img } = srcOf(<Icon type="browser" name="yandex" />)

    fireEvent.error(img)

    expect(img).toHaveAttribute("src", "/icons/generic.svg")
  })
})
