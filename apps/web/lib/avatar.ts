import "server-only"

import { micah } from "@dicebear/collection"
import { createAvatar } from "@dicebear/core"

// Pastel backgrounds that sit well next to the brand blue in both themes.
const BACKGROUNDS = ["c7d8fd", "ffd8c2", "d6f0de", "f6d4f0", "fff0b3"]

/**
 * A playful generated face for `seed`, as a data URI. Generated on our
 * server, so no third party sees the seeds or who is looking at whom. Same
 * seed, same face.
 * Style: "Micah" by Micah Lanier, CC BY 4.0 (credited on the settings page).
 */
export function generatedAvatar(seed: string): string {
  return createAvatar(micah, {
    seed,
    backgroundColor: BACKGROUNDS,
    backgroundType: ["solid"],
  }).toDataUri()
}

type AvatarUser = { id: string; image?: string | null }

/** The sign-in provider's photo (Google), else a generated face. */
export function userAvatar(user: AvatarUser): string {
  if (user.image && isHttpsUrl(user.image)) return user.image
  return generatedAvatar(user.id)
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}
