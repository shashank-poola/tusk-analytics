# Dashboard design

Friendly precision: the numbers come first, the page feels calm, and small
moments of play (a tally mark, a count-up, a warm "connected") reward
attention without getting in the way. Metric definitions live in
[`docs/metrics.md`](../metrics.md); this note covers how they look.

## Layout

```
┌ header (no bottom rule) ────────────────────────────────────────────┐
│ ▮ viewtally                                      [☾] [photo/face ▾] │
└─────────────────────────────────────────────────────────────────────┘
  [site ▾] [‹ | Last 7 days ▾ | ›] [vs previous 7 days] [Daily ▾] [⟳] [Country: India ×]

  ┌ Overview card ──────────────────────────────────────────────────┐
  │ Visitors │ Pageviews │ Bounce rate │ Session time │ Online ●    │
  │ 38% ↑    │ …         │ 4% ↑        │ 32% ↓        │             │
  │ ‹ chart: visitors only, smooth line over a soft gradient       ›│
  │   (dashed running bucket, source icons on the biggest peaks)    │
  └─────────────────────────────────────────────────────────────────┘
  [ Channel·Referrer·Campaign ]       [ Hostname·Page·Entry·Exit link ]
  [ Map·Country·Region·City ]         [ Browser·OS·Device ]
  [ Goal · Funnel · User                                    search ]
```

- One container: `max-w-6xl`, `px-4 sm:px-6`, sections `space-y-5`.
- Breakdown cards are a fixed `h-[31rem]` with 10 rows and a "Details"
  dialog for up to 50: empty, half-full and full cards are the same size.
  Each card keeps its tab in its own search param (`?sources=campaign`),
  the bottom card in `?insights=`. A row click adds a filter
  (`?country=IN`), shown as a removable chip in the filter row.
- URLs stay clean: `/site/<id>` is one website's dashboard and `/sites`
  lists all of the user's websites. Clicking a link that sets the view
  (`ViewLink`, or `useSetView` in code) calls a server action that stores
  it in a per-site cookie (`vt_view`, 30 days) and Next re-renders the
  page, so the address bar never shows what was clicked. The link's href
  (`?view=1&range=30d&…`) still works for a new tab or without JavaScript:
  `apps/web/proxy.ts` turns it into the same cookie and redirects to the
  bare URL. The page reads the cookie and validates it like any query. Only
  a view too long for a cookie stays in the URL. Those links don't
  prefetch.
- The view is made of: the period is `?range=` (+ `offset` for ‹ ›) or `custom` with
  `from`/`to`, picked on a two-month calendar (no date library); the chart
  interval is `?interval=`. Keys T, Y, H, W, M jump to Today, Yesterday,
  24 hours, 7 and 30 days. "vs …" (`?compare=1`) adds the previous period
  to the chart as a dotted line.
- Chart: visitors only, one continuous curve (monotone, through every
  point; the running bucket is the same curve, dashed), a 2.5 px line
  with a soft glow over a fading gradient, dots on every point up to 31 points, a dashed crosshair and a
  tooltip with pageviews and the change versus the previous period.
- KPI strip: 2 columns on phones, 3 on `sm`, one row of 5 on `lg`; no info
  icons. Every number has its change under it ("38% ↑"); from an empty
  previous period that's "100% ↑". With no visits the chart stays (flat)
  with a "No visits in this period" overlay.
- The map is interactive: a card with the country and its visitors follows
  the pointer, and a click on a visited country filters by it.
- 375 px: everything stacks; tabs scroll horizontally; every tap target is
  at least 44 px (`h-11`, `sm:h-9`).

## Brand and tokens

Brand colours: **Blue Ribbon `#1E61F0`**, **Black `#000000`**, **Catskill
White `#F1F4F9`**. Typeface: **Gellix** (`next/font/local` from
`apps/web/public/font`, weights 400–700); Geist Mono for code.

Defined once in `packages/ui/src/styles/globals.css` as CSS variables on
`:root` and `.dark`, exposed to Tailwind through `@theme inline`. Components
use token utilities only, never palette colours.

| Token                    | Light               | Dark                | Use                                     |
| ------------------------ | ------------------- | ------------------- | --------------------------------------- |
| `background`             | `#F1F4F9`           | `#1C1C1C`           | page, tab tracks                        |
| `surface`                | `#FFFFFF`           | `#242424`           | cards, menus, dialogs                   |
| `foreground`             | `#0B0D12`           | `#F2F2F2`           | text                                    |
| `muted` / `-foreground`  | `#E9EDF4`/`#5D6472` | `#303030`/`#A3A3A3` | quiet fills, active tab, secondary text |
| `border`                 | `#E0E5EE`           | `#323232`           | 1 px hairlines                          |
| `accent` / `-foreground` | `#1E61F0` / white   | `#5C8FF7` / black   | the brand blue: focus, active, buttons  |
| `accent-soft`            | `#E2EBFD`           | `#2F4A61`           | breakdown bars (steel blue), chips      |
| `chart-1` / `chart-2`    | accent / `#B4CBFA`  | `#8CC8F5`/`#3A4C5C` | visitors line, map, funnel / pageviews  |
| `live`                   | green               | green               | the Online dot only                     |
| `highlight`              | marigold            | marigold            | celebration only                        |
| `positive` / `negative`  | green / red         | green / red         | delta chips, next to an arrow + sign    |

- Dark accent is lighter than the brand blue so text and thin lines pass
  contrast; buttons on it use dark text.
- Dark greys and steel blues follow DataFast's dark dashboard.
- Radii: cards `rounded-[1.25rem]`; filter-row controls and tabs
  `rounded-lg` on a `rounded-xl` track; bars `rounded-md`.
- Faces: the signed-in user's Google photo, otherwise a DiceBear "Micah"
  face (CC BY 4.0, credited on /settings) generated on the server from the
  user id. Visitors get a Micah face and a stable nickname ("Curious Otter")
  from their visitor id, generated on the server, so the id never reaches
  the browser.
- Row icons: static SVGs in `apps/web/public/icons/` (browsers, os,
  devices, flags from `flag-icons`, known referrers), rendered as plain
  `<img>` by `components/ui/icon.tsx`. Nothing is computed at render.
- Unknown referrer domains use Google's favicon service
  (`www.google.com/s2/favicons`), which tells Google which domains send
  traffic to our customers. The request comes from the dashboard viewer's
  browser, so Google also sees their IP, user agent and google.com
  cookies; `referrerPolicy="no-referrer"` only keeps the dashboard URL
  out. Only the hostname is sent. Accepted trade-off for recognisable rows.
- Site favicon: fetched by our API from the customer's own site
  (`GET /api/v1/sites/:siteId/favicon`, cached a day), with a letter
  fallback.

## Motion

- Durations 150–300 ms; easing `cubic-bezier(0.2, 0, 0, 1)` (`ease-out-soft`).
- Allowed: count-up of KPI numbers (300 ms, on first load and range
  change), bars growing in (300 ms), chart series fading in (300 ms),
  hover and focus feedback (150 ms), tally marks drawing in once (loading
  hint, Connected celebration), the small live pulse (step 4B).
- Not allowed: loops other than the live pulse (skeletons are static),
  confetti, sound, anything that delays or hides numbers. The server always
  renders the final number; count-up only replays it.
- `prefers-reduced-motion: reduce` turns every animation and transition
  off globally (`globals.css`), and `usePrefersReducedMotion` skips the
  count-up and recharts animation.

## From the references, and what's different

Taken from DataFast: the filter row (site, period with ‹ ›, interval,
refresh), the numbers row directly on top of one large chart, dashed
running bucket, breakdown cards with tab pills, steel-blue bars and fixed
heights, the channel donut, the world map, a details dialog for the long
tail, "Direct/None", the Goal / Funnel / User card with faces and activity
dots, dark greys.

Different on purpose: light and dark both first class; the chart shows the
previous period, the change per bucket on hover and the top source on its
peaks; every number explains itself on hover and focus; change is never
colour alone; filters are visible chips; tally marks for loading and empty
states. Revenue (bars, revenue metrics, the $ axis, Spent, Journey,
Keyword) waits for payments.
