# Bots and source classification

## Bot handling (cheapest checks first)

1. Tracker side: don't send when `navigator.webdriver` is true, or on
   `localhost`, `127.0.0.1`, `file:` and prerendered pages
   (`document.prerendering`).
2. Server side, before any D1 read:
   - Missing or empty `User-Agent` → drop.
   - User agent matches a short case-insensitive pattern list: `bot`,
     `crawl`, `spider`, `slurp`, `headless`, `lighthouse`, `pingdom`,
     `uptime`, `preview`, `python-requests`, `curl/`, `wget/`, `go-http`,
     `axios/`, `node-fetch`, `facebookexternalhit`, `whatsapp`. Keep the list
     in one module with a test per entry.
   - `request.cf.botManagement?.verifiedBot === true` → drop. The
     `botManagement` object (`verifiedBot`, `score`) is typed in
     `@cloudflare/workers-types` but only populated on plans with Bot
     Management, so treat it as optional and never require it.
3. Count drops (a log line with the reason, sampled), never store them as
   events.

Don't fingerprint (canvas, fonts, IP + UA hashes stored per visitor) to
catch bots: it conflicts with the privacy rules in the `tracker-script`
skill.

## Source classification

Inputs: referrer hostname, `utm_source`, `utm_medium`, and the site's own
domain.

1. Referrer hostname equals the site's domain or a subdomain → internal
   navigation, keep the visitor's existing source (`source` = `null` on the
   event).
2. `utm_source` present → lowercase, trimmed, ≤ 64 chars, `[a-z0-9._-]`
   only, then map known aliases (`twitter`, `t.co`, `x.com` → `x`;
   `chat.openai.com`, `chatgpt.com` → `chatgpt`; `news.ycombinator.com` →
   `hackernews`).
3. Else referrer hostname → same alias map; search engines → `google`,
   `bing`, `duckduckgo`; unknown hosts → the bare hostname.
4. Neither → `direct`.

The map is data (`hostname → channel`), unit-tested, and covers the values
the dashboard shows. The `visitors.firstSource` column stores the result of
the visitor's first event only.
