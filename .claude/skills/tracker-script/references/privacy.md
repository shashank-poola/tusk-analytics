# Tracker privacy rules

## Identifiers

| What       | Where                                 | Value                                      | Lifetime                     |
| ---------- | ------------------------------------- | ------------------------------------------ | ---------------------------- |
| Visitor id | first-party cookie `vt_vid`           | 16 random chars (`crypto.getRandomValues`) | 365 days, refreshed on visit |
| Session id | `sessionStorage` `vt_sid` + timestamp | random; new after 30 minutes of inactivity | tab session                  |

Cookie attributes: `Path=/; SameSite=Lax; Secure` (omit `Secure` on
`http:`), `Max-Age=31536000`, set on the current host. No `Domain=`
attribute unless the owner opts in for cross-subdomain tracking.

Why a cookie: revenue attribution needs the same visitor id at checkout
(the owner's server reads `vt_vid` and puts it into the provider's checkout
metadata). A per-day hash wouldn't survive until the payment.

**Open decision for the user:** a persistent identifier usually needs
consent under the EU ePrivacy rules. Options are a consent-gated mode
(`data-consent="required"` → no cookie until
`viewtally("consent", true)`) or documenting that owners must cover
Viewtally in their consent banner. Don't ship cookie changes without this
decided.

## Never collected

IP addresses (the server uses `cf.country` and doesn't store the IP),
full user agents (only browser/os/device buckets server-side), query
strings in paths, page titles, form values, element text, screen
resolution, timezone, fonts or any other fingerprinting signal, and emails
or names in custom-event props. `identify` takes the owner's opaque user
id, which must not be an email; reject values containing `@`.

## Retention

Raw `events` rows should have a retention limit; none is enforced yet.
Flag any feature that would keep raw events indefinitely.
