import { eq, and, count } from 'drizzle-orm'
import { lots, fields } from '../../db'
import type { Db } from '../../shared/db'
import type { CreateLotInput, UpdateLotInput } from '../../validators/lots'

export class LotsRepository {
  constructor(private db: Db) {}

  async findByField(fieldId: string) {
    return this.db.select().from(lots).where(eq(lots.fieldId, fieldId))
  }

  async findByFieldPaginated(fieldId: string, limit: number, offset: number) {
    const [rows, [{ total }]] = await Promise.all([
      this.db.select().from(lots).where(eq(lots.fieldId, fieldId)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(lots).where(eq(lots.fieldId, fieldId)),
    ])
    return { rows, total: Number(total) }
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const rows = await this.db
      .select({ lot: lots })
      .from(lots)
      .innerJoin(fields, eq(lots.fieldId, fields.id))
      .where(and(eq(lots.id, id), eq(fields.tenantId, tenantId)))
    return rows[0]?.lot ?? null
  }

  async create(fieldId: string, input: CreateLotInput) {
    const rows = await this.db.insert(lots).values({ ...input, fieldId }).returning()
    return rows[0]
  }

  async update(id: string, input: UpdateLotInput) {
    const rows = await this.db.update(lots).set(input).where(eq(lots.id, id)).returning()
    return rows[0] ?? null
  }

  async delete(id: string) {
    const rows = await this.db.delete(lots).where(eq(lots.id, id)).returning()
    return rows[0] ?? null
  }
}
