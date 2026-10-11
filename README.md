<div align="center">
  <img src="apps/web/public/company/logo.png" alt="Tusk" width="88" />

  <h1>Tusk</h1>

  <p><strong>Simple, friendly web analytics for indie hackers and small SaaS teams.</strong></p>

  <p>
    <a href="https://usetusk.dev">Website</a> ·
    <a href="https://usetusk.dev/docs">Docs</a> ·
    <a href="#local-development">Run it locally</a> ·
    <a href="#contributing">Contributing</a>
  </p>

  <p>
    <img alt="License: Apache 2.0" src="https://img.shields.io/badge/license-Apache%202.0-2D8CFF" />
    <img alt="Runs on Cloudflare Workers" src="https://img.shields.io/badge/runs%20on-Cloudflare%20Workers-F38020" />
    <img alt="Bun 1.3" src="https://img.shields.io/badge/bun-1.3-000000" />
  </p>
</div>

---

Tusk is a small tracking script and a dashboard that answers the questions
you actually ask: who's on my site right now, where did they come from, and
did they sign up? One page, no report builder, no IP addresses stored.

## Why Tusk?

- **One page of answers.** Visitors, pageviews, bounce rate and visit
  duration, with referrers, pages, countries and devices beside them.
- **Live.** See who's online right now, updating as people arrive.
- **Visitors with names.** Every visitor gets a friendly name like
  _Curious Puffin_, so you can follow a visit without knowing who it is.
- **Goals and funnels.** Count signups, purchases and clicks, then see where
  people drop off.
- **Private by default.** Location is worked out at the edge and the IP is
  never stored. Run the script in cookieless mode if you'd rather set no
  cookies at all.
- **Tiny script.** Zero dependencies, under 2 KB gzipped, handles
  single-page apps and outbound links on its own.
- **Ask AI about your stats.** A built-in MCP server lets Claude Code,
  Cursor, Codex or Claude Desktop read your numbers with a read-only token.
- **Fast and cheap to run.** The whole backend is a Cloudflare Worker and a
  D1 database.

## Getting started

The quickest way is the hosted version at [usetusk.dev](https://usetusk.dev):
add your domain, paste one line into your site's `<head>`, and visits show
up within seconds.

```html
<script
  defer
  data-site="vt_your_site_id"
  src="https://usetusk.dev/script.js"
></script>
```

Prefer npm? Use [`@usetusk/analytics`](packages/analytics/README.md):

```ts
import { initTusk, track } from "@usetusk/analytics"

initTusk({ siteId: "vt_your_site_id" })
track("signup")
```

Track a goal without writing code by adding an attribute to any element:

```html
<button data-vt-goal="signup">Create account</button>
```

Guides for Next.js, Lovable, Shopify, goals, cookieless mode and MCP are in
the [docs](https://usetusk.dev/docs).

## Tech stack

- **API:** [Hono](https://hono.dev) on Cloudflare Workers, auth by
  [Better Auth](https://www.better-auth.com)
- **Database:** Cloudflare D1 (SQLite) with [Drizzle ORM](https://orm.drizzle.team)
- **Dashboard:** Next.js 16, Tailwind CSS 4 and shadcn/ui
- **Tracker:** plain TypeScript, no dependencies
- **Tooling:** Bun, Turborepo, Vitest (API tests run inside workerd)

## Project structure

```
apps/
  api/          Hono API Worker: auth, /api/v1, the collect endpoint, MCP
  web/          Next.js dashboard and marketing site
packages/
  tracker/      The browser script, served by the API as /script.js
  analytics/    @usetusk/analytics, the npm wrapper around the script
  db/           Drizzle schema, queries and D1 migrations
  contracts/    zod schemas and types shared by the API and the dashboard
  ui/           Shared styles, design tokens and components
docs/           Metric definitions, MCP notes, deploy runbook
```

The browser only talks to the dashboard; `/api/*` is proxied to the API
Worker so auth cookies stay first-party. How each number is counted is
written down in [docs/metrics.md](docs/metrics.md).

## Local development

### Prerequisites

- [Bun](https://bun.sh) 1.3
- Node.js 20.9 or newer

### Setup

```bash
git clone https://github.com/shashank-poola/viewtally.git
cd viewtally
bun install --frozen-lockfile
```

Create `apps/web/.env` from `apps/web/.env.example`, and
`apps/api/.dev.vars` with these keys:

```
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=        # 32+ characters: openssl rand -base64 32
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
```

Then create the local database and start everything:

```bash
bun run db:migrate
bun run dev
```

The dashboard runs on http://localhost:3000 and the API on
http://localhost:8787. To fill a site with sample traffic:

```bash
bun run db:seed -- --site <site-id> --events 20000
```

### Useful scripts

| Task                           | Command                                               |
| ------------------------------ | ----------------------------------------------------- |
| Lint / typecheck / test        | `bun run lint` · `bun run typecheck` · `bun run test` |
| Format                         | `bun run format`                                      |
| Build                          | `bun run build`                                       |
| New migration from the schema  | `bun run db:generate`                                 |
| Try the tracker on a test page | `bun run tracker:dev`                                 |
| Check the tracker's size       | `bun run check:tracker-size`                          |

## Roadmap

- Revenue attribution: link each payment (Stripe, Polar, Lemon Squeezy and
  others) to the traffic source that first brought the customer.
- Weekly email with the three numbers that matter.
- Milestone and traffic-spike notifications.

## Contributing

Issues and pull requests are welcome. Before opening a PR:

1. Run `bun run lint`, `bun run typecheck` and `bun run test`.
2. Read [AGENTS.md](AGENTS.md) for the house rules: every route that touches
   customer data checks site ownership, migrations are additive only, and
   anything that comes from the tracker is untrusted input.
3. Keep design changes in line with [DESIGN.md](DESIGN.md).

## License

[Apache License 2.0](LICENSE).
