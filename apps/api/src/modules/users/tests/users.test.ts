import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, type TestDb } from '../../../shared/test-db'
import { UsersRepository } from '../users.repository'
import { UsersService } from '../users.service'
import { tenants, users } from '../../../db'

describe('UsersService', () => {
  let service: UsersService
  let db: TestDb
  const tenantId = '00000000-0000-0000-0000-000000000001'
  let ownerId: string

  beforeEach(async () => {
    db = await createTestDb()
    service = new UsersService(new UsersRepository(db))
    await db.insert(tenants).values({ id: tenantId, name: 'Tenant A' })
    const [owner] = await db.insert(users).values({
      tenantId, email: 'owner@test.com', passwordHash: 'x', role: 'owner',
    }).returning()
    ownerId = owner.id
  })

  it('lista usuarios del tenant con paginación', async () => {
    const result = await service.list(tenantId, 1, 20)
    expect(result.rows).toHaveLength(1)
    expect(result.total).toBe(1)
  })

  it('invita un usuario nuevo', async () => {
    const user = await service.invite(tenantId, {
      email: 'manager@test.com', password: 'password123', role: 'manager',
    })
    expect(user.role).toBe('manager')
    expect(user.email).toBe('manager@test.com')
  })

  it('no permite invitar con email duplicado', async () => {
    await expect(
      service.invite(tenantId, { email: 'owner@test.com', password: 'password123', role: 'manager' })
    ).rejects.toThrow('ya está registrado en este tenant')
  })

  it('actualiza el rol de un usuario', async () => {
    const invited = await service.invite(tenantId, {
      email: 'op@test.com', password: 'password123', role: 'operator',
    })
    const updated = await service.updateRole(invited.id, tenantId, { role: 'manager' })
    expect(updated!.role).toBe('manager')
  })

  it('no permite cambiar rol del owner', async () => {
    await expect(
      service.updateRole(ownerId, tenantId, { role: 'manager' })
    ).rejects.toThrow('No se puede modificar el rol del owner')
  })

  it('elimina un usuario', async () => {
    const invited = await service.invite(tenantId, {
      email: 'del@test.com', password: 'password123', role: 'operator',
    })
    await service.remove(invited.id, tenantId, ownerId)
    const result = await service.list(tenantId, 1, 20)
    expect(result.rows).toHaveLength(1) // solo queda el owner
  })

  it('no permite eliminar al owner', async () => {
    await expect(
      service.remove(ownerId, tenantId, ownerId)
    ).rejects.toThrow('No se puede eliminar al owner')
  })

  it('no permite que un usuario se elimine a sí mismo', async () => {
    const invited = await service.invite(tenantId, {
      email: 'self@test.com', password: 'password123', role: 'operator',
    })
    await expect(
      service.remove(invited.id, tenantId, invited.id)
    ).rejects.toThrow('No podés eliminarte')
  })
})
