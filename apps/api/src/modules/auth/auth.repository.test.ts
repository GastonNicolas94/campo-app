import { describe, it, expect, beforeAll } from 'vitest'
import { createTestDb, type TestDb } from '../../shared/test-db'
import { AuthRepository } from './auth.repository'

let db: TestDb
let repo: AuthRepository

beforeAll(async () => {
  db = await createTestDb()
  repo = new AuthRepository(db)
})

describe('AuthRepository', () => {
  it('crea un tenant', async () => {
    const tenant = await repo.createTenant({ name: 'Estancia Los Robles' })
    expect(tenant.id).toBeDefined()
    expect(tenant.name).toBe('Estancia Los Robles')
  })

  it('crea un usuario en un tenant', async () => {
    const tenant = await repo.createTenant({ name: 'Estancia El Palmar' })
    const user = await repo.createUser({
      tenantId: tenant.id,
      email: 'juan@example.com',
      passwordHash: 'hashed_pw',
      phone: '+5491112345678',
      role: 'owner',
    })
    expect(user.id).toBeDefined()
    expect(user.email).toBe('juan@example.com')
    expect(user.tenantId).toBe(tenant.id)
  })

  it('encuentra un usuario por email', async () => {
    const tenant = await repo.createTenant({ name: 'Estancia La Paz' })
    await repo.createUser({
      tenantId: tenant.id,
      email: 'pedro@example.com',
      passwordHash: 'pw',
      phone: null,
      role: 'manager',
    })
    const found = await repo.findByEmail('pedro@example.com')
    expect(found?.email).toBe('pedro@example.com')
  })

  it('retorna null si el usuario no existe', async () => {
    const found = await repo.findByEmail('noexiste@example.com')
    expect(found).toBeNull()
  })

  it('encuentra un usuario por id', async () => {
    const tenant = await repo.createTenant({ name: 'Estancia Santa Rosa' })
    const created = await repo.createUser({
      tenantId: tenant.id,
      email: 'ana@example.com',
      passwordHash: 'pw',
      phone: null,
      role: 'owner',
    })
    const found = await repo.findById(created.id)
    expect(found?.id).toBe(created.id)
  })
})
