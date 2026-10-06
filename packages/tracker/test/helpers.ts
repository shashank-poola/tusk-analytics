import type { CollectPayload } from "@workspace/contracts"
import { vi } from "vitest"

export const SITE_ID = "vt_3k9x2m7qpd4n8r1t"
export const SCRIPT_SRC = "https://api.viewtally.test/script.js"

const originalPushState = history.pushState
const originalReplaceState = history.replaceState
let popstateListeners: EventListenerOrEventListenerObject[] = []

/** A mocked navigator.sendBeacon; read what it sent with `sentPayloads`. */
export function mockBeacon(accept = true) {
  const sendBeacon = vi.fn((_url: string, _body: Blob) => accept)
  Object.defineProperty(navigator, "sendBeacon", {
    value: sendBeacon,
    configurable: true,
  })
  return sendBeacon
}

export async function sentPayloads(
  beacon: ReturnType<typeof mockBeacon>
): Promise<CollectPayload[]> {
  return Promise.all(
    beacon.mock.calls.map(
      async ([, body]) => JSON.parse(await body.text()) as CollectPayload
    )
  )
}

/**
 * Runs the tracker's entry point as if a `<script>` tag with `attributes`
 * had just loaded it, in a fresh module instance.
 */
export async function loadTracker(
  attributes: Record<string, string> = { "data-site": SITE_ID }
) {
  const script = document.createElement("script")
  script.src = SCRIPT_SRC
  for (const [name, value] of Object.entries(attributes)) {
    script.setAttribute(name, value)
  }
  Object.defineProperty(document, "currentScript", {
    value: script,
    configurable: true,
  })

  // Remember popstate listeners so resetPage() can remove them; jsdom keeps
  // the same window for every test in a file.
  const addEventListener = vi
    .spyOn(window, "addEventListener")
    .mockImplementation(function (this: Window, type, listener, options) {
      if (type === "popstate" && listener) popstateListeners.push(listener)
      EventTarget.prototype.addEventListener.call(this, type, listener, options)
    })

  vi.resetModules()
  await import("../src/index")
  addEventListener.mockRestore()
}

/** Undoes everything the tracker and the tests changed on the page. */
export function resetPage() {
  vi.restoreAllMocks()
  for (const listener of popstateListeners) {
    removeEventListener("popstate", listener)
  }
  popstateListeners = []
  history.pushState = originalPushState
  history.replaceState = originalReplaceState
  history.replaceState(null, "", "/")
  for (const name of ["vt_vid", "vt_sid"]) {
    document.cookie = `${name}=; Max-Age=0; Path=/`
  }
  localStorage.clear()
  Reflect.deleteProperty(document, "currentScript")
  Reflect.deleteProperty(navigator, "sendBeacon")
  vi.useRealTimers()
}
