import { eq, and, count } from 'drizzle-orm'
import { users } from '../../db'
import type { Db } from '../../shared/db'
import type { InviteUserInput } from '../../validators/users'

export class UsersRepository {
  constructor(private db: Db) {}

  async findByTenant(tenantId: string, limit: number, offset: number) {
    const [rows, [{ total }]] = await Promise.all([
      this.db.select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        role: users.role,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.tenantId, tenantId)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(users).where(eq(users.tenantId, tenantId)),
    ])
    return { rows, total: Number(total) }
  }

  async findByIdAndTenant(id: string, tenantId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
    return user ?? null
  }

  async findByEmailAndTenant(email: string, tenantId: string) {
    const [user] = await this.db.select().from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    return user ?? null
  }

  async create(tenantId: string, input: InviteUserInput, passwordHash: string) {
    const [user] = await this.db.insert(users).values({
      tenantId,
      email: input.email,
      passwordHash,
      phone: input.phone ?? null,
      role: input.role,
    }).returning()
    return user
  }

  async updateRole(id: string, tenantId: string, role: 'manager' | 'operator' | 'accountant') {
    const [user] = await this.db
      .update(users)
      .set({ role })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
      .returning()
    return user ?? null
  }

  async delete(id: string, tenantId: string) {
    await this.db.delete(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId)))
  }
}
