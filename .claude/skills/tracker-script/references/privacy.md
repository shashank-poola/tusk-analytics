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
read `utm_source`, `utm_medium` and `utm_campaign`. The server keeps the
path and those three values only. `document.referrer` is reduced to its
hostname server-side. The User-Agent header is reduced to browser, OS and
device buckets.

## Never collected

IP addresses (the server uses `cf.country` and doesn't store the IP),
full user agents, query strings in paths, page titles, form values,
element text, screen resolution, timezone, fonts or any other
fingerprinting signal, and emails or names. A future `identify` must take
the owner's opaque user id, which must not be an email; reject values
containing `@`.

## Retention

Raw `events` rows should have a retention limit; none is enforced yet.
Flag any feature that would keep raw events indefinitely.
