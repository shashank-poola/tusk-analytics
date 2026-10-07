# Dashboard design

Tusk's design system has two modes. **Playful** (sign-in, onboarding,
empty states, milestones): big Feather Bold type, Tusk the hippo, lots of
space. **Working** (dashboard, tables, charts, settings): dense and calm;
the more data on screen, the quieter the page. The playfulness lives in the
mascot, the chunky buttons and the copy, never in the data. Metric definitions live in
[`docs/metrics.md`](../metrics.md); this note covers how they look.

## Layout

```
┌ header (no bottom rule) ────────────────────────────────────────────┐
│ 🦛 tusk                                          [☾] [photo/face ▾] │
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
- Tab titles: most specific first, brand last, one `·` separator, because
  tabs truncate from the right: `shashank.ink · Tusk`, `Settings · Tusk`.
  The root layout owns the `%s · Tusk` template; a page sets only its own
  part (`generateMetadata` with the cached `getSite` for site pages). A
  missing or someone else's site is `Page not found · Tusk`.
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

Colours: **Tusk Blue `#2D8CFF`** (brand fills, charts), **Button Blue
`#1F7AF0`** with a **Deep Water `#1558C0`** bottom edge, Deep Water for
blue text on white. Neutrals Riverbed `#17202E` (text), Mud `#5A6678`,
Mist `#E2E8F0` (borders), Riverbank `#F4F7FB`, white page. Status:
Growth Green `#22B573`, Alert Red `#F0443A`, Sunrise `#FFB020`. Mascot
colours (Pip Teal `#2EC4B6`, Snap Purple `#8B5CF6`, Peck Coral
`#FF6B4A`) only in chart series and character art, never UI chrome.

Type: **Feather Bold** for h1–h3, page titles (24 px), section headings
(18 px) and big KPI numbers (40 px); one weight, 700 only, with
`font-synthesis: none`. **Fredoka** 400–600 for everything else (body
15 px). JetBrains Mono for code. All from `next/font` in
`apps/web/app/layout.tsx` (local files in `apps/web/public/font`).
Sentence case everywhere, no all-caps labels.

Defined once in `packages/ui/src/styles/globals.css` as CSS variables on
`:root` and `.dark`, exposed to Tailwind through `@theme inline`. Components
use token utilities only, never palette colours.

| Token                         | Light                                     | Dark                | Use                                      |
| ----------------------------- | ----------------------------------------- | ------------------- | ---------------------------------------- |
| `background`                  | `#FFFFFF`                                 | `#0C1017`           | page                                     |
| `surface`                     | `#FFFFFF`                                 | `#131821`           | cards, menus, dialogs                    |
| `foreground`                  | `#17202E`                                 | `#EEF1F6`           | text                                     |
| `muted` / `-foreground`       | `#F4F7FB`/`#5A6678`                       | `#1B212B`/`#9AA3B2` | tab tracks, quiet fills / secondary text |
| `border`                      | `#E2E8F0`                                 | `#242B36`           | 2 px card and input borders              |
| `accent` / `-foreground`      | `#2D8CFF` / white                         | same                | Tusk Blue fills: focus, active, chips    |
| `accent-soft`                 | `#E6F1FF` (Foam)                          | `#19283D`           | breakdown bars, selected, focus ring     |
| `link`                        | `#1558C0`                                 | `#5AA6FF`           | blue text and links, menu check marks    |
| `button` / `-hover` / `-edge` | `#1F7AF0` / `#1668DC` / `#1558C0`         | same                | primary buttons                          |
| `chart-1`…`chart-4`           | Tusk Blue, Sunrise, Pip Teal, Snap Purple | same                | series in that order                     |
| `live` / `positive`           | green                                     | green               | Online dot; delta chips with an arrow    |
| `negative` / `danger-edge`    | red / dark red                            | same                | errors, danger button                    |
| `highlight`                   | Sunrise                                   | Sunrise             | milestones only                          |

- Buttons (`components/ui/button-styles.ts`, `BUTTON_CLASSES`): primary,
  secondary and danger, 12 px radius, a 4 px bottom edge drawn as a box
  shadow. Hover goes a shade darker (never lighter: white text keeps its
  contrast) and lifts 2 px while the edge grows 2 px; pressing moves the
  button down 4 px and drops the edge (120 ms). Nothing around it moves.
  Only action buttons get this; toolbar chips, tabs and menus stay flat.
- Dark mode is near-black with a hint of navy (page `#0C1017`, cards
  `#131821`), so the blue lives in the brand colour and the data, not the
  chrome.
- Inputs (`INPUT_CLASSES`): 2 px Mist border, 12 px radius, Tusk Blue
  focus border with a 3 px Foam ring.
- Radii: chips and progress 9999 px, buttons and inputs 12 px
  (`rounded-xl`), cards 16 px (`rounded-2xl`), dialogs 20 px
  (`rounded-[1.25rem]`). Dashboard cards are flat: 2 px border, no shadow.
- Logo: `components/brand/logo.tsx`, the hippo (`/company/logo.png`, no
  backdrop) with "tusk" in Feather Bold. Mascot art: the same hippo in
  onboarding (first-visit jump) and `/mascot/404.png` (Tusk lost with a
  map) on `app/not-found.tsx`, with no backdrop. One mascot per screen,
  never inside tables, charts or settings.
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
- Allowed: count-up of KPI numbers (600 ms, first load only), bars
  growing in (300 ms), chart series fading in (300 ms), hover and focus
  feedback (150 ms), button press (120 ms), Tusk's single jump with a short
  spring (480 ms, `animate-jump`) when the first visit arrives, the small
  live pulse.
- Not allowed: loops other than the live pulse (skeletons are static),
  entrance animations on every section, bouncing controls, sound, anything
  that delays or hides numbers. The server always
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
colour alone; filters are visible chips; Tusk for onboarding and
celebrations. Revenue (bars, revenue metrics, the $ axis, Spent, Journey,
Keyword) waits for payments.
