# Dashboard design

Friendly precision: the numbers come first, the page feels calm, and small
moments of play (a tally mark, a count-up, a warm "connected") reward
attention without getting in the way. Metric definitions live in
[`docs/metrics.md`](../metrics.md); this note covers how they look.

## Layout

```
┌ header ─────────────────────────────────────────────────────────────┐
│ ▮ viewtally   [site ▾]                              [☾] [avatar ▾]  │
└─────────────────────────────────────────────────────────────────────┘
  Hey Shashank, 1,204 people visited myapp.com          [24h 7d 30d 90d]
  in the last 7 days.   That's 18% more than the previous 7 days.
  [slot: Visitors now — step 4B]

  [ Visitors ] [ Pageviews ] [ Sessions ] [ Bounce rate ]     KPI cards
  [ Chart: visitors (area) + pageviews (line) ........... ]   main chart
  [ Highlights: up to three sentences ]                       highlights
  [ Sources ] [ Pages ]                                       breakdowns
  [ Countries ] [ Devices · Device / Browser / OS ]
```

- One container: `max-w-6xl`, `px-4 sm:px-6`, sections `space-y-6`.
- KPI cards: 2 columns below `lg`, 4 above. Breakdowns: 1 column below
  `lg`, 2 above. No group has more than six widgets.
- 375 px: everything stacks; the range control and device tabs scroll
  horizontally; every tap target is at least 44 px (`h-11`, `sm:h-9`).

## Tokens

Defined once in `packages/ui/src/styles/globals.css` as CSS variables on
`:root` and `.dark`, exposed to Tailwind through `@theme inline`. Components
use token utilities only (`bg-surface`, `text-muted-foreground`,
`border-border`, `bg-accent`), never palette colours.

| Token                     | Light                         | Dark                          | Use                                     |
| ------------------------- | ----------------------------- | ----------------------------- | --------------------------------------- |
| `background`              | `oklch(0.985 .003 265)`       | `oklch(0.165 .012 265)`       | page                                    |
| `surface`                 | `oklch(1 0 0)`                | `oklch(0.205 .014 265)`       | cards, menus, dialogs                   |
| `foreground`              | `oklch(0.21 .02 265)`         | `oklch(0.96 .005 265)`        | text                                    |
| `muted` / `-foreground`   | `.96` / `.52`                 | `.255` / `.71`                | quiet fills, secondary text             |
| `border`                  | `oklch(0.915 .008 265)`       | `oklch(0.3 .014 265)`         | 1 px hairlines                          |
| `accent` / `-foreground`  | cobalt `oklch(0.52 .19 262)`  | `oklch(0.7 .15 262)`          | the one accent: focus, active, visitors |
| `accent-soft`             | `oklch(0.95 .03 262)`         | `oklch(0.3 .07 262)`          | bars, selected backgrounds              |
| `highlight`               | marigold `oklch(0.8 .15 75)`  | `oklch(0.82 .14 75)`          | live and celebration only               |
| `positive` / `negative`   | `.55 .13 155` / `.56 .19 27`  | `.75 .13 155` / `.72 .15 27`  | delta chips, next to an arrow + sign    |
| `chart-1` / `chart-2`     | accent / `oklch(.74 .07 262)` | accent / `oklch(.52 .08 262)` | visitors / pageviews                    |

- Dark islands: an element that should stay dark in both themes (the
  sign-in panel, the code snippet) gets the `dark` class, so it uses the
  dark values of the same tokens. No separate "inverse" colours.
- Exception: the Google sign-in button keeps Google's four logo colours,
  as its branding rules require.
- Radii: cards and dialogs `rounded-2xl` (1 rem); controls `rounded-full`
  (pills) or `rounded-lg`; bars `rounded-md`.
- Shadows: `shadow-card` (a 1 px lift plus a soft 16 px glow at 4 %
  opacity) on cards; `shadow-pop` on menus and dialogs. In dark mode the
  shadows fade out and the border carries the edge.
- Type (Geist): greeting `text-2xl sm:text-3xl` / tight tracking; KPI value
  `text-3xl` semibold `tabular-nums`; card titles `text-sm font-medium`;
  body `text-sm`; captions `text-xs text-muted-foreground`.
- Spacing: 4 px grid; cards `p-5`, rows `py-2`, sections `gap-4`/`gap-6`.

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

Taken from DataFast: the numbers row directly on top of one large chart;
breakdowns as compact cards with proportional bars behind each row; tabs
inside a card instead of separate pages; "Direct/None" grouping; a details
dialog for the long tail; empty states that keep the card frame so the
page doesn't jump.

Different on purpose:

- **Light and dark**, both first class, instead of dark only.
- **A sentence first.** The greeting and highlights say what happened in
  plain words before the numbers; DataFast starts with raw numbers.
- **Every number explains itself**: a one-line definition on hover and
  focus, taken from `docs/metrics.md`.
- **Change is never colour alone**: arrow, sign and "pts" for bounce rate.
- **No third-party favicons or flag images.** DataFast shows referrer
  favicons; fetching them would tell a third party who links to our
  customers. Viewtally uses neutral category icons and emoji flags.
- **Calmer density**: four KPI cards instead of seven, top 5 rows per card
  with "View all", one accent colour instead of blue plus orange.
- **Our own motif**: tally marks for the logo, loading, the empty state and
  the Connected moment, instead of avatars and a globe.
