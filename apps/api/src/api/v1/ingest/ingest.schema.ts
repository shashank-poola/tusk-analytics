// The payload itself is `collectPayloadSchema` in @workspace/contracts.

/** A pageview payload is ~500 bytes; anything near this isn't the tracker. */
export const MAX_COLLECT_BODY_BYTES = 4 * 1024

/** Cap for values the server derives from the URL (UTM parameters, source). */
export const MAX_DERIVED_VALUE_LENGTH = 256

/** Cap for `request.cf.region` and `request.cf.city`: real names are short. */
export const MAX_PLACE_NAME_LENGTH = 100

/**
 * Cap for the stored path. `URL` percent-encodes it, so a 2048-character URL
 * can produce a path several times longer.
 */
export const MAX_PATH_LENGTH = 1024

/** DNS names are at most 253 characters. */
export const MAX_HOSTNAME_LENGTH = 253

/** Cap for the stored `campaign_params` (five capped, encoded values). */
export const MAX_CAMPAIGN_PARAMS_LENGTH = 1024

/** Cap for an outbound link's stored host and path. */
export const MAX_OUTBOUND_URL_LENGTH = 512
