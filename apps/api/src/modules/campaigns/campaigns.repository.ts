import { eq, and } from 'drizzle-orm'
import { campaigns, campaignResults, lots, fields } from '../../db'
import type { Db } from '../../shared/db'
import type { CreateCampaignInput, UpdateCampaignInput, CampaignResultInput } from '../../validators/campaigns'

export class CampaignsRepository {
  constructor(private db: Db) {}

  async findByLot(lotId: string) {
    return this.db.select().from(campaigns).where(eq(campaigns.lotId, lotId))
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const rows = await this.db
      .select({ campaign: campaigns })
      .from(campaigns)
      .innerJoin(lots, eq(campaigns.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .where(and(eq(campaigns.id, id), eq(fields.tenantId, tenantId)))
    return rows[0]?.campaign ?? null
  }

  async create(lotId: string, input: CreateCampaignInput) {
    const rows = await this.db.insert(campaigns).values({ ...input, lotId }).returning()
    return rows[0]
  }

  async update(id: string, input: UpdateCampaignInput & { status?: 'active' | 'closed' }) {
    const rows = await this.db.update(campaigns).set(input).where(eq(campaigns.id, id)).returning()
    return rows[0] ?? null
  }

  async createResult(campaignId: string, input: CampaignResultInput) {
    const rows = await this.db.insert(campaignResults).values({ ...input, campaignId }).returning()
    return rows[0]
  }

  async findResults(campaignId: string) {
    return this.db.select().from(campaignResults).where(eq(campaignResults.campaignId, campaignId))
  }
}
