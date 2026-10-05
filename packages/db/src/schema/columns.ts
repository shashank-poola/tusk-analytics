import { integer } from "drizzle-orm/sqlite-core"

// All timestamps are stored as unix milliseconds and read back as `Date`.

export const timestamp = (name: string) =>
  integer(name, { mode: "timestamp_ms" })

export const createdAt = () =>
  timestamp("created_at")
    .notNull()
    .$defaultFn(() => new Date())

export const updatedAt = () =>
  timestamp("updated_at")
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date())
