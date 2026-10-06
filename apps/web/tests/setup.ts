import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

/**
 * jsdom has no media queries. Report "reduced motion" so count-ups and
 * charts render their final values; a test that needs motion stubs it.
 */
export function stubMatchMedia(prefersReducedMotion: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: query.includes("prefers-reduced-motion") && prefersReducedMotion,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) satisfies MediaQueryList
}

// jsdom implements <dialog> without its methods.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false
}

stubMatchMedia(true)

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  stubMatchMedia(true)
})
