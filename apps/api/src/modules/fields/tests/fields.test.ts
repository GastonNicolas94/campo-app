import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, type TestDb } from '../../../shared/test-db'
import { FieldsRepository } from '../fields.repository'
import { FieldsService } from '../fields.service'
import { tenants } from '../../../db'

describe('FieldsService', () => {
  let service: FieldsService
  let db: TestDb
  const tenantId = '00000000-0000-0000-0000-000000000001'
  const otherTenantId = '00000000-0000-0000-0000-000000000002'

  beforeEach(async () => {
    db = await createTestDb()
    await db.insert(tenants).values([
      { id: tenantId, name: 'Tenant A' },
      { id: otherTenantId, name: 'Tenant B' }
    ])
    service = new FieldsService(new FieldsRepository(db))
  })

  it('crea un establecimiento', async () => {
    const field = await service.create(tenantId, { name: 'La Esperanza' })
    expect(field.name).toBe('La Esperanza')
    expect(field.tenantId).toBe(tenantId)
  })

  it('lista solo los establecimientos del tenant', async () => {
    await service.create(tenantId, { name: 'Campo A' })
    await service.create(otherTenantId, { name: 'Campo B' })
    const result = await service.getAll(tenantId)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Campo A')
  })

  it('obtiene por id del mismo tenant', async () => {
    const created = await service.create(tenantId, { name: 'La Paloma' })
    const found = await service.getById(created.id, tenantId)
    expect(found.name).toBe('La Paloma')
  })

  it('no puede acceder a campo de otro tenant', async () => {
    const created = await service.create(tenantId, { name: 'Privado' })
    await expect(service.getById(created.id, otherTenantId)).rejects.toThrow('no encontrado')
  })

  it('actualiza nombre', async () => {
    const created = await service.create(tenantId, { name: 'Viejo' })
    const updated = await service.update(created.id, tenantId, { name: 'Nuevo' })
    expect(updated.name).toBe('Nuevo')
  })

  it('elimina establecimiento', async () => {
    const created = await service.create(tenantId, { name: 'Temporal' })
    await service.delete(created.id, tenantId)
    await expect(service.getById(created.id, tenantId)).rejects.toThrow('no encontrado')
  })

  it('pagina resultados correctamente', async () => {
    await service.create(tenantId, { name: 'Campo 1' })
    await service.create(tenantId, { name: 'Campo 2' })
    await service.create(tenantId, { name: 'Campo 3' })
    await service.create(otherTenantId, { name: 'Campo Otro' })

    const page1 = await service.getAllPaginated(tenantId, 2, 0)
    expect(page1.rows).toHaveLength(2)
    expect(page1.total).toBe(3)

    const page2 = await service.getAllPaginated(tenantId, 2, 2)
    expect(page2.rows).toHaveLength(1)
    expect(page2.total).toBe(3)
  })
})
