# Bots and source classification

## Bot handling (cheapest checks first)

1. Tracker side: nothing is sent on `localhost`, `127.0.0.1`, `file:` or
   prerendered pages. (`navigator.webdriver` isn't checked; headless
   browsers are caught by their user agent instead.)
2. Server side, before any D1 read (`bot-filter.ts`):
   - Missing or blank `User-Agent` → drop.
   - User agent contains (case-insensitive) one of: `bot`, `crawl`,
     `spider`, `slurp`, `headless`, `lighthouse`, `pingdom`, `uptime`,
     `preview`, `python-requests`, `curl/`, `wget/`, `go-http`, `axios/`,
     `node-fetch`, `facebookexternalhit`, `whatsapp`. Own list instead of
     the `isbot` package: small, fast, and covers what hits analytics
     endpoints. Add an entry with a real UA fixture in
     `apps/api/test/user-agent.test.ts`.
   - Not used yet: `request.cf.botManagement?.verifiedBot` (only populated
     on plans with Bot Management).
3. Drops are logged (`collect: event dropped`, `reason: "bot"`), never
   stored as events.

Don't fingerprint (canvas, fonts, IP + UA hashes stored per visitor) to
catch bots: it conflicts with the privacy rules in the `tracker-script`
skill.

## Source classification (`referrer-source.ts`)

1. Referrer hostname equal to the site's domain or `www.<domain>` counts
   as no referrer.
2. `utm_source` present → its value, lowercased (not mapped through the
   table).
3. Else the referrer hostname, matched with all its parent domains against
   `REFERRERS` in `packages/contracts/src/referrers.ts` (`sourceForHost`):
   `t.co` → x, `l.facebook.com` → facebook, `news.ycombinator.com` →
   hackernews, `google.<country tld>` (regex) → google, and so on. The
   dashboard reads the same map for names and icons. Unknown hosts → the
   bare hostname.
4. Neither → `direct`.

`visitors.firstSource` stores the result for the visitor's first event
only; every event stores its own `source`.
