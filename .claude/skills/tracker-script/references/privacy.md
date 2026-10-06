# Tracker privacy rules

## Identifiers

| What       | Where                       | Value                               | Lifetime                              |
| ---------- | --------------------------- | ----------------------------------- | ------------------------------------- |
| Visitor id | first-party cookie `vt_vid` | `crypto.randomUUID()`               | 1 year from first visit, not extended |
| Session id | first-party cookie `vt_sid` | `crypto.randomUUID()`               | 30 minutes, extended by every event   |
| Opt-out    | `localStorage` `vt_ignore`  | read only; set by the owner by hand | until cleared                         |

Cookie attributes: `Path=/; SameSite=Lax; Max-Age=…`, plus `Secure` on
`https:`, set on the current host. No `Domain=` attribute, so no
cross-subdomain tracking. Cookie values that aren't a v4 UUID are replaced.

Why a cookie: revenue attribution needs the same visitor id at checkout
(the owner's server reads `vt_vid` and puts it into the provider's checkout
metadata). A per-day hash wouldn't survive until the payment. The session
id is a cookie rather than `sessionStorage` so one visit spans tabs.

**Open decision for the user:** a persistent identifier usually needs
consent under the EU ePrivacy rules. Options are a consent-gated mode
(`data-consent="required"` → no cookie until
`viewtally("consent", true)`) or documenting that owners must cover
Viewtally in their consent banner. Not decided yet; don't widen cookie use
without it.

## Sent but not stored

The full page URL (origin, path, query; never the hash) so the server can
read `utm_source`, `utm_medium`, `utm_campaign`, `ref` and `via`. The server
keeps the hostname, the path and those five values only (a `ref` or `via`
containing `@` is dropped as a likely email). Outbound and goal events send
the same URL.

Outbound link clicks send the link's origin and path (the tracker drops its
query and hash); the server keeps `host/path`. Goal events send a slug name
(`^[a-z0-9][a-z0-9_-]{0,63}$`) that the server stores as the event name.
Owners must keep personal data out of goal names, `ref`/`via` values and
the paths they link to: these are labels, never user data. Link paths can
still hold tokens (`/invite/abc123`); that is the owner's markup, not
something the tracker can tell apart.

The dashboard's visitors list shows each visitor's activity over the last 7
days (one dot per day with a pageview), computed from stored events. `document.referrer` is reduced to its
hostname server-side. The User-Agent header is reduced to browser, OS and
device buckets (ua-parser-js, then an allowlist of known slugs; anything
else is stored as null).

The dashboard (not the tracker) asks Google's favicon service for referrer
hostnames not in the known referrer map, from the site owner's browser.
Only the hostname is sent; see `docs/design/dashboard.md`.

The client IP is never sent by the tracker or stored: at ingest, Cloudflare
derives country, region and city from it (`request.cf.country`, `.region`,
`.city`), and only those are stored, on `events` (country also on
`visitors` as first touch). The dashboard's visitors list shows a per-site
pseudonym (HMAC of the visitor id), never the `vt_vid` cookie value.

## Never collected

IP addresses (the server uses `cf.country`, `cf.region` and `cf.city` and
doesn't store the IP), precise location (finer than city),
full user agents, query strings in paths, page titles, form values,
element text, screen resolution, timezone, fonts or any other
fingerprinting signal, and emails or names. A future `identify` must take
the owner's opaque user id, which must not be an email; reject values
containing `@`.

## Retention

Raw `events` rows should have a retention limit; none is enforced yet (open
decision). Region and city make each row more identifying, so flag any
feature that would keep raw events indefinitely.
