import { cors } from "hono/cors"

/**
 * CORS for the public ingest endpoint only: the tracking script posts to it
 * from customer sites, so any origin is allowed and cookies are not. The
 * ingest service checks the origin against the site's domain.
 */
export const corsPublic = cors({
  origin: "*",
  credentials: false,
  allowMethods: ["POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  maxAge: 86400,
})
