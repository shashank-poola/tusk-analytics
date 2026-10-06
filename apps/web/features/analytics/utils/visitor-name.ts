// Visitors are anonymous. A stable nickname makes a list of them easier to
// scan and talk about ("the Curious Otter came back") without naming anyone.

const ADJECTIVES = [
  "Curious",
  "Brave",
  "Sunny",
  "Swift",
  "Quiet",
  "Clever",
  "Lucky",
  "Bold",
  "Gentle",
  "Witty",
  "Cosmic",
  "Jolly",
  "Nimble",
  "Mellow",
  "Zesty",
  "Breezy",
]

const ANIMALS = [
  "Otter",
  "Panda",
  "Falcon",
  "Koala",
  "Fox",
  "Lynx",
  "Owl",
  "Dolphin",
  "Badger",
  "Heron",
  "Gecko",
  "Moose",
  "Puffin",
  "Hedgehog",
  "Llama",
  "Quokka",
]

/** FNV-1a: small, fast and stable across server restarts. */
function hash(value: string): number {
  let result = 0x811c9dc5
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 0x01000193)
  }
  return result >>> 0
}

/** Same visitor id, same nickname: "Curious Otter". */
export function visitorName(visitorId: string): string {
  const value = hash(visitorId)
  const adjective = ADJECTIVES[value % ADJECTIVES.length]
  const animal = ANIMALS[Math.floor(value / ADJECTIVES.length) % ANIMALS.length]
  // The modulo keeps both indexes in range; the fallbacks satisfy the types.
  return `${adjective ?? "Mystery"} ${animal ?? "Visitor"}`
}
