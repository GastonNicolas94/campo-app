import { eq } from 'drizzle-orm'
import { tenants, users } from '../../db'
import type { Db } from '../../shared/db'
import type { Role } from '../../types'

interface CreateTenantInput {
  name: string
}

interface CreateUserInput {
  tenantId: string
  email: string
  passwordHash: string
  phone: string | null
  role: Role
}

export class AuthRepository {
  constructor(private db: Db) {}

  async createTenant(input: CreateTenantInput) {
    const [tenant] = await this.db.insert(tenants).values(input).returning()
    return tenant
  }

  async createUser(input: CreateUserInput) {
    const [user] = await this.db.insert(users).values(input).returning()
    return user
  }

  async findByEmail(email: string) {
    const [user] = await this.db.select().from(users).where(eq(users.email, email))
    return user ?? null
  }

  async findById(id: string) {
    const [user] = await this.db.select().from(users).where(eq(users.id, id))
    return user ?? null
  }
}
