/** A customer site's icon, ready to serve. */
export type Favicon = { bytes: Uint8Array<ArrayBuffer>; contentType: string }

/**
 * Headers for serving a customer's icon from our origin, fresh or cached. The
 * CSP sandbox keeps an SVG icon from running script if someone opens the URL
 * directly.
 */
export function faviconHeaders(contentType: string): Record<string, string> {
  return {
    "Content-Type": contentType,
    "Cache-Control": "private, max-age=86400",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy":
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "Content-Disposition": 'inline; filename="favicon"',
  }
}
