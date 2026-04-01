import { eq, and, count } from 'drizzle-orm'
import { stockItems, stockMovements, fields } from '../../db'
import type { Db } from '../../shared/db'
import type { CreateStockItemInput, UpdateStockItemInput, CreateMovementInput } from '../../validators/stock'

export class StockRepository {
  constructor(private db: Db) {}

  async findByTenant(tenantId: string) {
    const rows = await this.db
      .select({ item: stockItems })
      .from(stockItems)
      .innerJoin(fields, eq(stockItems.fieldId, fields.id))
      .where(eq(fields.tenantId, tenantId))
    return rows.map(r => r.item)
  }

  async findByTenantPaginated(tenantId: string, limit: number, offset: number) {
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select({ item: stockItems })
        .from(stockItems)
        .innerJoin(fields, eq(stockItems.fieldId, fields.id))
        .where(eq(fields.tenantId, tenantId))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(stockItems)
        .innerJoin(fields, eq(stockItems.fieldId, fields.id))
        .where(eq(fields.tenantId, tenantId)),
    ])
    return { rows: rows.map(r => r.item), total: Number(total) }
  }

  async findByField(fieldId: string, tenantId: string) {
    const rows = await this.db
      .select({ item: stockItems })
      .from(stockItems)
      .innerJoin(fields, eq(stockItems.fieldId, fields.id))
      .where(and(eq(stockItems.fieldId, fieldId), eq(fields.tenantId, tenantId)))
    return rows.map(r => r.item)
  }

  async findByFieldPaginated(fieldId: string, tenantId: string, limit: number, offset: number) {
    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select({ item: stockItems })
        .from(stockItems)
        .innerJoin(fields, eq(stockItems.fieldId, fields.id))
        .where(and(eq(stockItems.fieldId, fieldId), eq(fields.tenantId, tenantId)))
        .limit(limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(stockItems)
        .innerJoin(fields, eq(stockItems.fieldId, fields.id))
        .where(and(eq(stockItems.fieldId, fieldId), eq(fields.tenantId, tenantId))),
    ])
    return { rows: rows.map(r => r.item), total: Number(total) }
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const rows = await this.db
      .select({ item: stockItems })
      .from(stockItems)
      .innerJoin(fields, eq(stockItems.fieldId, fields.id))
      .where(and(eq(stockItems.id, id), eq(fields.tenantId, tenantId)))
    return rows[0]?.item ?? null
  }

  async create(input: CreateStockItemInput) {
    const rows = await this.db.insert(stockItems).values({
      ...input,
      currentQuantity: String(input.currentQuantity ?? 0),
      alertThreshold: input.alertThreshold != null ? String(input.alertThreshold) : null,
    }).returning()
    return rows[0]
  }

  async update(id: string, input: UpdateStockItemInput) {
    const values: Record<string, unknown> = { ...input }
    if (input.currentQuantity != null) values.currentQuantity = String(input.currentQuantity)
    if (input.alertThreshold != null) values.alertThreshold = String(input.alertThreshold)
    const rows = await this.db.update(stockItems).set(values).where(eq(stockItems.id, id)).returning()
    return rows[0] ?? null
  }

  async delete(id: string) {
    const rows = await this.db.delete(stockItems).where(eq(stockItems.id, id)).returning()
    return rows[0] ?? null
  }

  async createMovement(itemId: string, input: CreateMovementInput, userId?: string) {
    const rows = await this.db.insert(stockMovements).values({
      itemId,
      type: input.type,
      quantity: String(input.quantity),
      date: input.date,
      reason: input.reason,
      userId,
    }).returning()
    return rows[0]
  }

  async findMovements(itemId: string) {
    return this.db.select().from(stockMovements).where(eq(stockMovements.itemId, itemId))
  }

  async findMovementsPaginated(itemId: string, limit: number, offset: number) {
    const [rows, [{ total }]] = await Promise.all([
      this.db.select().from(stockMovements).where(eq(stockMovements.itemId, itemId)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(stockMovements).where(eq(stockMovements.itemId, itemId)),
    ])
    return { rows, total: Number(total) }
  }

  async updateQuantity(id: string, newQuantity: number) {
    const rows = await this.db
      .update(stockItems)
      .set({ currentQuantity: String(newQuantity) })
      .where(eq(stockItems.id, id))
      .returning()
    return rows[0] ?? null
  }

  async findAlerts(tenantId: string) {
    const all = await this.findByTenant(tenantId)
    return all.filter(item =>
      item.alertThreshold != null &&
      Number(item.currentQuantity) <= Number(item.alertThreshold)
    )
  }
}
