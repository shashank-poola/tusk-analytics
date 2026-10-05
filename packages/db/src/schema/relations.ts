import { relations } from "drizzle-orm"

import { account, session, user } from "./auth"
import { integrations, payments } from "./revenue"
import { sites } from "./sites"

// Relations power `db.query.*.findMany({ with: ... })`. They don't change SQL.

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  sites: many(sites),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const siteRelations = relations(sites, ({ one, many }) => ({
  owner: one(user, { fields: [sites.ownerId], references: [user.id] }),
  integrations: many(integrations),
  payments: many(payments),
}))

export const integrationRelations = relations(integrations, ({ one }) => ({
  site: one(sites, { fields: [integrations.siteId], references: [sites.id] }),
}))

export const paymentRelations = relations(payments, ({ one }) => ({
  site: one(sites, { fields: [payments.siteId], references: [sites.id] }),
}))
