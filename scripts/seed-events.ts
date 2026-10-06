/**
 * Seeds realistic pageviews for one site into the LOCAL D1 database, for
 * dashboard work and performance checks.
 *
 *   bun run db:seed -- --site vt_x --events 20000 [--days 30] [--seed 1]
 *
 * It opens the SQLite file that `bun run db:migrate` and `bun run dev` use
 * under .wrangler/state, so it has no way to reach the remote database. The
 * same --seed gives the same data relative to the current hour. Running it
 * again adds more events and never deletes; visitors already in the
 * database keep their first touch even if a later run adds earlier visits,
 * so start from a fresh database for exact attribution. Traffic model:
 * seed-traffic.ts.
 */
import { Database } from "bun:sqlite"
import { existsSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"

import { generateSessions, type TrafficOptions } from "./seed-traffic"

const LOCAL_D1_DIR = resolve(
  import.meta.dir,
  "../.wrangler/state/v3/d1/miniflare-D1DatabaseObject"
)
const MAX_EVENTS = 1_000_000
const MAX_DAYS = 365
const HOUR_MS = 60 * 60 * 1000

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

type Options = TrafficOptions & { siteId: string }

function readOptions(argv: string[]): Options {
  if (argv.some((arg) => /remote/i.test(arg)) || process.env.DB_TARGET) {
    fail(
      "db:seed only writes to the local database. Remove --remote / DB_TARGET and run it again."
    )
  }
  const { values } = parseArgs({
    args: argv.filter((arg) => arg !== "--"),
    options: {
      site: { type: "string" },
      events: { type: "string" },
      days: { type: "string", default: "30" },
      seed: { type: "string", default: "1" },
    },
    strict: true,
  })
  const usage =
    "Usage: bun run db:seed -- --site vt_x --events 20000 [--days 30] [--seed 1]"
  const integer = (value: string | undefined, name: string, max: number) => {
    const number = Number(value)
    if (!Number.isInteger(number) || number < 1 || number > max) {
      fail(`--${name} must be a whole number from 1 to ${max}.\n${usage}`)
    }
    return number
  }
  if (!values.site) fail(`--site is required.\n${usage}`)
  return {
    siteId: values.site,
    events: integer(values.events, "events", MAX_EVENTS),
    days: integer(values.days, "days", MAX_DAYS),
    seed: integer(values.seed, "seed", 2 ** 31),
  }
}

/** The wrangler-managed SQLite file that holds the app's tables. */
function openLocalDatabase(): Database {
  const files = existsSync(LOCAL_D1_DIR)
    ? readdirSync(LOCAL_D1_DIR).filter(
        (file) => file.endsWith(".sqlite") && file !== "metadata.sqlite"
      )
    : []
  const withSchema = files.flatMap((file) => {
    const db = new Database(join(LOCAL_D1_DIR, file))
    if (db.query("SELECT 1 FROM sqlite_master WHERE name = 'events'").get()) {
      return [db]
    }
    db.close()
    return []
  })
  const [db, ...others] = withSchema
  if (!db)
    fail("No migrated local database found. Run `bun run db:migrate` first.")
  if (others.length > 0) {
    fail(
      `Found ${withSchema.length} local databases with an events table in ${LOCAL_D1_DIR}; expected one.`
    )
  }
  // `bun run dev` may hold a lock on the same file; wait instead of failing.
  db.exec("PRAGMA busy_timeout = 5000")
  return db
}

function main() {
  const options = readOptions(process.argv.slice(2))
  const db = openLocalDatabase()
  const site = db
    .query<{ timezone: string }, [string]>(
      "SELECT timezone FROM sites WHERE id = ?"
    )
    .get(options.siteId)
  if (!site) {
    fail(
      `No site ${options.siteId} in the local database. Create it in the dashboard (bun run dev) first.`
    )
  }

  const end = Math.floor(Date.now() / HOUR_MS) * HOUR_MS
  const sessions = generateSessions(options, site.timezone, end)

  const insertVisitor = db.prepare(`
    INSERT INTO visitors (site_id, visitor_id, first_source, first_referrer,
      first_landing_path, first_country, first_seen_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (site_id, visitor_id)
    DO UPDATE SET last_seen_at = max(last_seen_at, excluded.last_seen_at)`)
  const insertEvent = db.prepare(`
    INSERT INTO events (site_id, visitor_id, session_id, name, path, referrer,
      source, country, browser, os, device, created_at)
    VALUES (?, ?, ?, 'pageview', ?, ?, ?, ?, ?, ?, ?, ?)`)

  let written = 0
  db.transaction(() => {
    for (const { id, visitor, source, pageviews } of sessions) {
      const [landing] = pageviews
      if (!landing) continue
      insertVisitor.run(
        options.siteId,
        visitor.id,
        source.source,
        source.referrer,
        landing.path,
        visitor.country,
        landing.at,
        landing.at
      )
      for (const pageview of pageviews) {
        // Pages after the landing page are internal navigation: no referrer
        // host, so ingest classifies them as direct.
        const isLanding = pageview === landing
        insertEvent.run(
          options.siteId,
          visitor.id,
          id,
          pageview.path,
          isLanding ? source.referrer : null,
          isLanding ? source.source : "direct",
          visitor.country,
          visitor.client.browser,
          visitor.client.os,
          visitor.client.device,
          pageview.at
        )
        written++
      }
    }
  })()

  console.log(
    `Seeded ${written} pageviews in ${sessions.length} sessions for ${options.siteId} over the last ${options.days} days (seed ${options.seed}).`
  )
}

main()
