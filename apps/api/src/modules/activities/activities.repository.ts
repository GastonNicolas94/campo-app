import { eq, and, isNull, count } from 'drizzle-orm'
import { activities, fields, lots } from '../../db'
import type { Db } from '../../shared/db'
import type { CreateActivityInput, UpdateActivityInput, PatchStatusInput } from '../../validators/activities'

export class ActivitiesRepository {
  constructor(private db: Db) {}

  async findByTenant(tenantId: string, filters: {
    lotId?: string
    campaignId?: string
    assignedTo?: string | null
    status?: string
    type?: string
  }) {
    const rows = await this.db
      .select({ activity: activities })
      .from(activities)
      .innerJoin(lots, eq(activities.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .where(
        and(
          eq(fields.tenantId, tenantId),
          filters.lotId ? eq(activities.lotId, filters.lotId) : undefined,
          filters.campaignId ? eq(activities.campaignId, filters.campaignId) : undefined,
          filters.assignedTo === null
            ? isNull(activities.assignedTo)
            : filters.assignedTo
            ? eq(activities.assignedTo, filters.assignedTo)
            : undefined,
          filters.status
            ? eq(activities.status, filters.status as 'pending' | 'done' | 'skipped')
            : undefined,
          filters.type
            ? eq(activities.type, filters.type as 'siembra' | 'fertilizacion' | 'riego' | 'cosecha' | 'fumigacion' | 'laboreo' | 'otro')
            : undefined,
        )
      )
    return rows.map(r => r.activity)
  }

  async findByTenantPaginated(tenantId: string, filters: {
    lotId?: string
    campaignId?: string
    assignedTo?: string | null
    status?: string
    type?: string
  }, limit: number, offset: number) {
    const whereCondition = and(
      eq(fields.tenantId, tenantId),
      filters.lotId ? eq(activities.lotId, filters.lotId) : undefined,
      filters.campaignId ? eq(activities.campaignId, filters.campaignId) : undefined,
      filters.assignedTo === null
        ? isNull(activities.assignedTo)
        : filters.assignedTo
        ? eq(activities.assignedTo, filters.assignedTo)
        : undefined,
      filters.status
        ? eq(activities.status, filters.status as 'pending' | 'done' | 'skipped')
        : undefined,
      filters.type
        ? eq(activities.type, filters.type as 'siembra' | 'fertilizacion' | 'riego' | 'cosecha' | 'fumigacion' | 'laboreo' | 'otro')
        : undefined,
    )

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select({ activity: activities })
        .from(activities)
        .innerJoin(lots, eq(activities.lotId, lots.id))
        .innerJoin(fields, eq(lots.fieldId, fields.id))
        .where(whereCondition)
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(activities)
        .innerJoin(lots, eq(activities.lotId, lots.id))
        .innerJoin(fields, eq(lots.fieldId, fields.id))
        .where(whereCondition),
    ])
    return { rows: rows.map(r => r.activity), total: Number(total) }
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const rows = await this.db
      .select({ activity: activities })
      .from(activities)
      .innerJoin(lots, eq(activities.lotId, lots.id))
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .where(and(eq(activities.id, id), eq(fields.tenantId, tenantId)))
    return rows[0]?.activity ?? null
  }

  async create(input: CreateActivityInput & { createdBy: string }) {
    const rows = await this.db.insert(activities).values(input).returning()
    return rows[0]
  }

  async update(id: string, input: UpdateActivityInput) {
    const rows = await this.db.update(activities).set(input).where(eq(activities.id, id)).returning()
    return rows[0] ?? null
  }

  async patchStatus(id: string, input: PatchStatusInput) {
    const rows = await this.db
      .update(activities)
      .set({ status: input.status, completionNotes: input.completionNotes, completedAt: new Date() })
      .where(eq(activities.id, id))
      .returning()
    return rows[0] ?? null
  }

  async delete(id: string) {
    const rows = await this.db.delete(activities).where(eq(activities.id, id)).returning()
    return rows[0] ?? null
  }
}
