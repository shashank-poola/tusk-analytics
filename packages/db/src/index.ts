export { createDb, type Database } from "./client"
export { createId } from "./lib/id"
export * from "./schema"
export * from "./queries/revenue"
export * from "./queries/sites"
export * from "./queries/stats"

// Re-exported so apps use the same drizzle-orm instance as the schema.
export * from "drizzle-orm/sql"
