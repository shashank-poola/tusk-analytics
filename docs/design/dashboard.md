# Dashboard design

Friendly precision: the numbers come first, the page feels calm, and small
moments of play (a tally mark, a count-up, a warm "connected") reward
attention without getting in the way. Metric definitions live in
[`docs/metrics.md`](../metrics.md); this note covers how they look.

## Layout

```
┌ header (no bottom rule) ────────────────────────────────────────────┐
│ ▮ viewtally / [favicon site ▾]                   [☾] [photo/face ▾] │
└─────────────────────────────────────────────────────────────────────┘
  Hey Shashank, 1,204 people visited myapp.com in the last 7 days.
  [favicon myapp.com ⚙] [📅 Last 7 days ▾] [Daily]

  ┌ Overview card ──────────────────────────────────────────────────┐
  │ Visitors │ Pageviews │ Bounce rate │ Session time │ Online ●    │
  │ chart: visitors line (dashed while the bucket runs) + bars      │
  └─────────────────────────────────────────────────────────────────┘
  [ Highlights: up to three sentences ]
  [ Source·Channel·Referrer·Campaign ] [ Page·Entry·Exit ]   fixed height
  [ Country·Region·City ]              [ Browser·OS·Device ]
  [ Recent visitors: face, nickname, place, device, source, last seen ]
```

- One container: `max-w-6xl`, `px-4 sm:px-6`, sections `space-y-5`.
- Breakdown cards are a fixed `h-[28rem]` with 8 rows and a "Details"
  dialog for up to 50: empty, half-full and full cards are the same size.
  Each card keeps its tab in its own search param (`?sources=referrer`).
- KPI strip: 2 columns on phones, 3 on `sm`, one row of 5 on `lg`. With no
  visits in the range values show "–", and the chart stays (flat) with a
  "No visits in this period" overlay.
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
| `background`             | `#F1F4F9`           | `#0A0A0C`           | page                                    |
| `surface`                | `#FFFFFF`           | `#141417`           | cards, menus, dialogs                   |
| `foreground`             | `#0B0D12`           | `#F1F4F9`           | text                                    |
| `muted` / `-foreground`  | `#E9EDF4`/`#5D6472` | `#1E1F24`/`#9B9FAB` | quiet fills, secondary text             |
| `border`                 | `#E0E5EE`           | `#25262C`           | 1 px hairlines                          |
| `accent` / `-foreground` | `#1E61F0` / white   | `#5C8FF7` / black   | the brand blue: focus, active, visitors |
| `accent-soft`            | `#E2EBFD`           | `#19284A`           | breakdown bars, selected backgrounds    |
| `chart-1` / `chart-2`    | accent / `#B4CBFA`  | accent / `#24407C`  | visitors line / pageview bars           |
| `live`                   | green               | green               | the Online dot only                     |
| `highlight`              | marigold            | marigold            | celebration only                        |
| `positive` / `negative`  | green / red         | green / red         | delta chips, next to an arrow + sign    |

- Dark accent is lighter than the brand blue so text and thin lines pass
  contrast; buttons on it use dark text.
- Radii: cards `rounded-3xl`; controls `rounded-xl` or `rounded-full`; bars
  `rounded-lg`.
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

Taken from DataFast: the numbers row directly on top of one large chart,
dashed line for the running bucket, breakdown cards with tabs and
proportional bars, fixed card heights, a details dialog for the long tail,
"Direct / None", faces in the visitors list.

Different on purpose: light and dark both first class; a sentence first
(greeting, highlights); every number explains itself on hover and focus;
change is never colour alone; one
brand blue instead of blue plus orange; tally marks for loading and empty
states.
