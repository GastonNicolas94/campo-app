import { eq, and } from 'drizzle-orm'
import { fields } from '@campo-app/db'
import type { Db } from '../../shared/db'
import type { CreateFieldInput, UpdateFieldInput } from '@campo-app/validators/fields'

export class FieldsRepository {
  constructor(private db: Db) {}

  async findAll(tenantId: string) {
    return this.db.select().from(fields).where(eq(fields.tenantId, tenantId))
  }

  async findById(id: string, tenantId: string) {
    const rows = await this.db.select().from(fields)
      .where(and(eq(fields.id, id), eq(fields.tenantId, tenantId)))
    return rows[0] ?? null
  }

  async create(tenantId: string, input: CreateFieldInput) {
    const rows = await this.db.insert(fields).values({ ...input, tenantId }).returning()
    return rows[0]
  }

  async update(id: string, tenantId: string, input: UpdateFieldInput) {
    const rows = await this.db.update(fields)
      .set(input)
      .where(and(eq(fields.id, id), eq(fields.tenantId, tenantId)))
      .returning()
    return rows[0] ?? null
  }

  async delete(id: string, tenantId: string) {
    const rows = await this.db.delete(fields)
      .where(and(eq(fields.id, id), eq(fields.tenantId, tenantId)))
      .returning()
    return rows[0] ?? null
  }
}
