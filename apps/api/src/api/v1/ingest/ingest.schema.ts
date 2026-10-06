// The payload itself is `collectPayloadSchema` in @workspace/contracts.

/** A pageview payload is ~500 bytes; anything near this isn't the tracker. */
export const MAX_COLLECT_BODY_BYTES = 4 * 1024

/** Cap for values the server derives from the URL (UTM parameters, source). */
export const MAX_DERIVED_VALUE_LENGTH = 256

/**
 * Cap for the stored path. `URL` percent-encodes it, so a 2048-character URL
 * can produce a path several times longer.
 */
export const MAX_PATH_LENGTH = 1024
