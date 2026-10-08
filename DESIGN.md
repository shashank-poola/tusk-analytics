# Tusk Design System

> Web analytics for indie hackers and developers. A friendly blue hippo, chunky tactile buttons, and a dashboard that stays calm and readable.

Tusk is a dashboard people check every day. The playfulness lives in the mascot, the buttons and the copy. The data itself stays quiet and easy to read.

This file is the brand. How it is built in code (tokens, components, layout) is in [`docs/design/dashboard.md`](docs/design/dashboard.md). The tokens live in `packages/ui/src/styles/globals.css`.

## 1. Two modes, one brand

| Mode        | Where                                                      | Feel                                                   |
| ----------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| **Playful** | Sign-in, onboarding, empty states, milestones, 404, emails | Big type, big mascots, lots of space                   |
| **Working** | Dashboard, tables, charts, settings                        | Dense, calm, fast. Mascots show up only at key moments |

Rule: the more data on screen, the quieter the page. Never put a mascot next to a table you are trying to read.

## 2. Color

Tusk blue is the brand. It is deliberately not the exact blue used by other analytics tools.

### Core

- **Tusk Blue** `#2D8CFF`: mascot, brand fills, charts, illustrations, focus
- **Button Blue** `#1F7AF0`: primary button fill
- **Button Hover** `#1668DC`: primary button hover. Hover goes darker, never lighter, so white text keeps its contrast.
- **Deep Water** `#1558C0`: bottom edge of buttons, blue text and links on white
- **Shallows** `#5AA6FF`: blue text and links in dark mode, soft fills
- **Foam** `#E6F1FF`: selected rows, breakdown bars, focus ring, soft banners

### Neutrals

- **Tusk White** `#FFFFFF`: page background and cards
- **Riverbank** `#F4F7FB`: tab tracks, quiet fills, secondary surface
- **Mist** `#E2E8F0`: borders, dividers
- **Mud** `#5A6678`: secondary text
- **Riverbed** `#17202E`: primary text (use this instead of pure black)

### Status

- **Growth Green** `#22B573`: traffic up, success, the Online dot
- **Alert Red** `#F0443A`: errors, traffic drop, danger button (edge `#B8261E`)
- **Sunrise** `#FFB020`: milestones, highlights, warnings

### Mascot colors (only in character art and chart series, never in UI chrome)

- Pip Teal `#2EC4B6`
- Peck Coral `#FF6B4A`
- Snap Purple `#8B5CF6`
- Shell Sun `#FFB020`

### Dark mode

Dark mode is near-black with only a hint of navy. The blue belongs to the brand colour and the data, not to the page.

| Role                            | Value     |
| ------------------------------- | --------- |
| Background                      | `#0C1017` |
| Surface (cards, menus, dialogs) | `#131821` |
| Quiet fill (tab tracks)         | `#1B212B` |
| Border                          | `#242B36` |
| Text                            | `#EEF1F6` |
| Secondary text                  | `#9AA3B2` |
| Breakdown bars, selected        | `#19283D` |
| Links and blue text             | `#5AA6FF` |

Tusk Blue, Button Blue, Button Hover, Deep Water and the status colours stay the same in both modes.

Contrast note: white text on Button Blue is for 16px+ semibold only. Use Deep Water for any blue text on white.

## 3. Typography

- **Headings and big numbers**: Feather Bold. It only comes in one weight, so always set it to 700 and never ask for another weight. Turn off `font-synthesis` so the browser never fakes one.
- **Everything else**: Fredoka, weights 400, 500 and 600
- **Code**: JetBrains Mono

All three load through `next/font` in `apps/web/app/layout.tsx`:

| Font           | File                                                        | CSS variable            |
| -------------- | ----------------------------------------------------------- | ----------------------- |
| Feather Bold   | `public/font/feather-bold/Duolingo Feather Bold.ttf`        | `--font-feather`        |
| Fredoka        | `public/font/fredoka/Fredoka-{Regular,Medium,SemiBold}.ttf` | `--font-fredoka`        |
| JetBrains Mono | Google Fonts                                                | `--font-jetbrains-mono` |

The heading stack falls back to `"Baloo 2", system-ui` while Feather loads.

> Licence: Feather Bold is Duolingo's typeface. Confirm we are allowed to use it before production.

| Role                         | Font         | Size                  | Weight | Line height |
| ---------------------------- | ------------ | --------------------- | ------ | ----------- |
| Display (sign-in headline)   | Feather Bold | 56px                  | 700    | 1.05        |
| H1 (404, marketing)          | Feather Bold | 40px                  | 700    | 1.1         |
| Page title (dashboard)       | Feather Bold | 24px                  | 700    | 1.2         |
| Section heading              | Feather Bold | 18px                  | 700    | 1.25        |
| Big metric                   | Feather Bold | 40px (32px on phones) | 700    | 1.0         |
| Logo wordmark "tusk"         | Feather Bold | 28px                  | 700    | 1.0         |
| Body and descriptions        | Fredoka      | 15px                  | 400    | 1.5         |
| Table, caption, metric label | Fredoka      | 13px                  | 500    | 1.4         |
| Button                       | Fredoka      | 16px                  | 600    | 1.2         |

Keep paragraphs short. In tables, right-align number columns so figures stay easy to compare.

Keep body lines under 75 characters. Sentence case everywhere, no all-caps labels.

## 4. Components

Shared classes: `BUTTON_CLASSES` and `INPUT_CLASSES` in `apps/web/components/ui/button-styles.ts`. Use them instead of writing new button or input styles.

### Buttons (the signature)

- **Primary**: Button Blue fill, white text, radius 12px, padding 12px 20px, **4px Deep Water bottom edge**
- **Hover**: fill goes a shade darker (Button Hover), the button lifts 2px and the edge grows to 6px, so its bottom stays in place
- **Active**: moves down 4px and drops the edge, so it feels pressed
- **Secondary**: surface fill, 2px Mist border, 4px Mist bottom edge, Mud text. On hover the text turns Riverbed, the border picks up a little blue, and it lifts like the primary.
- **Danger**: Alert Red fill with a darker red bottom edge
- The edge is drawn as a box shadow, not a border, so pressing a button never moves anything around it
- All of it takes 120ms
- Use the chunky press on action buttons only ("Add site", "Copy snippet", "Save changes"). Toolbar chips, tabs and menus stay flat.

### Cards

- Surface fill, 2px border, radius 16px, padding 20px
- Dashboard cards are flat, with no shadow
- Breakdown cards (Referrer, Page, Region, Browser…) have a fixed height (31rem). They show the top 10 rows with "Details" at the bottom, so empty, half-full and full cards look the same.
- Tabs sit on a Riverbank track. The open tab is raised on the surface colour.

### Tables and charts

- 1px row dividers, no zebra stripes, 44px row height
- Chart series order: Tusk Blue, Sunrise, Pip Teal, Snap Purple, then Peck Coral
- Lines 2.5px with rounded caps, over a soft fading fill. Bars have a 6px top radius.
- No dots on the line. On hover, one dot on the hovered point plus a tooltip with the time and the visitor count.
- The bucket still running (this hour, today) is dashed
- The biggest peaks carry the icon of their top source (Google, X…)
- Y-axis: whole numbers only, 12px labels, wide enough that nothing is clipped. In dark mode the labels are a little lighter.
- Changes versus the previous period show as "38% ↑". The arrow is green when the change is good and red when it's bad. For bounce rate, up is bad.
- Always label the unit. Never rely on color alone.

### Inputs

- Surface fill, 2px Mist border, radius 12px, 15px text
- Focus: Tusk Blue border with a 3px Foam ring

### Radius scale

Chips and progress bars 9999px, buttons and inputs 12px, cards and menus 16px, dialogs 20px.

## 5. Logo and mascots

### Logo

- The smiling Tusk head (`public/company/logo.png`) with "tusk" in Feather Bold beside it
- No circle or backdrop behind the mark, in light or dark mode
- 48px in the header and on sign-in. On phones the header shows the mark alone.
- The same image is the favicon (`app/icon.png`)

### Character rules

- Build every character from one or two simple rounded shapes
- Flat fills, no outlines, one darker shade for the underside
- Never show a character static and expressionless. Always give it a pose or an emotion.
- Repeat shapes across the cast (round heads, round ears, stubby limbs)

### The cast and what each one means

| Character | Animal           | Role in the product                                  |
| --------- | ---------------- | ---------------------------------------------------- |
| Tusk      | Blue hippo       | Main guide, onboarding, milestones, general feedback |
| Pip       | Teal baby hippo  | New visitors, first-time setup, tips                 |
| Peck      | Coral oxpecker   | Live visitors, real-time view, notifications         |
| Snap      | Purple crocodile | Bounce rate, drop-offs, "someone left" moments       |
| Shell     | Sunrise turtle   | Slow pages, loading, performance                     |

### Art we have (`public/mascot/`)

| File                   | Shows                                          | Used for                                   |
| ---------------------- | ---------------------------------------------- | ------------------------------------------ |
| `404.png`              | Tusk lost, reading a map, with a question mark | The 404 page                               |
| `hippocelebration.png` | Tusk jumping in confetti                       | Milestones and the first visitor (planned) |
| `tealbucket.png`       | Pip sitting with a bucket, waiting             | Empty states (planned)                     |
| `hippobird.png`        | Peck sitting on Tusk's head                    | Traffic spikes (planned)                   |
| `turtle.png`           | Shell walking slowly                           | Loading, slow pages (planned)              |
| `group.png`            | The whole cast                                 | Marketing, emails                          |

Still needed: Peck alone (asleep and awake, for the Online count), Tusk waving (setup), Snap smirking (high bounce rate).

### Where they appear

Live today:

- **404 and missing sites**: the landing header, Tusk lost with his map (no backdrop), a plain explanation, "Go to dashboard" and "Back to home"
- **First visitor (onboarding)**: Tusk jumps once and the card says "Your first visitor just showed up."

Planned:

- Empty dashboard: Pip waiting, with the install snippet
- Milestones (100, 1k, 10k visitors): Tusk jumping, with confetti
- Traffic spike: Peck on Tusk's head, pointing
- High bounce rate: Snap smirking in the corner of that card only
- Loading: Shell walking slowly
- Weekly email: Tusk with the three numbers that matter

### Limits

- One mascot per screen. The sign-in page shows only the logo, with no mascot above the headline.
- No mascots inside tables, charts or settings pages
- Keep Tusk blue at full strength. Mascots float on the page with no box, circle or backdrop behind them; the only exception is the cast on a white card inside the blue band.

## 6. Motion

- Button hover and press: 120ms
- Number count-up: 600ms, on first load only. Later changes show at once.
- Breakdown bars grow in over 300ms. Hover and focus feedback takes 150ms.
- Milestones: one jump with a short spring (480ms), then stop
- The only loop is the small pulse on the Online dot. Skeletons stay static.
- No bouncing on every control, no entrance animations on every section, no confetti loops
- Respect `prefers-reduced-motion`: every animation and transition turns off, and numbers show at once

## 7. Voice

Friendly, short, a little cheeky. Never nags, never guilt-trips, never explains a joke.

- Empty state: "No visitors yet. Add the snippet and Tusk will start counting."
- First visitor: "Your first visitor just showed up."
- Milestone: "1,000 visitors. Not bad."
- 404: "Tusk couldn't find this page." Then one line on why, and "Go to dashboard".
- Error: "We couldn't load this report. Refresh to try again."
- Buttons say exactly what happens: "Add site", "Copy snippet", "Save changes", "Go to dashboard"

Errors explain what went wrong and how to fix it. Jokes stay in celebrations and empty states.

### Browser tab titles

Most specific first, brand last, with one `·` separator, because tabs cut text off from the right:

- `shashank.ink · Tusk` (a site's dashboard shows the site's name)
- `Install on shashank.ink · Tusk`
- `Your sites · Tusk`, `Settings · Tusk`, `Sign in · Tusk`
- `Page not found · Tusk` (also for a site that belongs to someone else)

## 8. Do and don't

- Do keep the chunky buttons, rounded shapes and mascot together. One alone does not make the brand.
- Do keep the dashboard calm. Fun goes in the moments, not the data.
- Do keep dark mode near-black. Blue belongs to the brand colour and the data.
- Don't make hover lighter. It washes out the button and the white text.
- Don't put a circle or backdrop behind the logo.
- Don't use gradients, glass or glossy highlights in the UI.
- Don't use the mascot colors for buttons, links or backgrounds.
- Don't copy another brand's characters, green or exact blue.
