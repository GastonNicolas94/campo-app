import { pgTable, uuid, text, numeric, date, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { lots } from './lots'

export const campaignStatusEnum = pgEnum('campaign_status', ['active', 'closed'])
export const yieldUnitEnum = pgEnum('yield_unit', ['qq_ha', 'tn_ha'])

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  lotId: uuid('lot_id').notNull().references(() => lots.id, { onDelete: 'cascade' }),
  crop: text('crop').notNull(),
  variety: text('variety'),
  sowingDate: date('sowing_date').notNull(),
  harvestDate: date('harvest_date'),
  status: campaignStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const campaignResults = pgTable('campaign_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  yieldAmount: numeric('yield_amount', { precision: 10, scale: 2 }),
  yieldUnit: yieldUnitEnum('yield_unit'),
  totalRevenue: numeric('total_revenue', { precision: 12, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
