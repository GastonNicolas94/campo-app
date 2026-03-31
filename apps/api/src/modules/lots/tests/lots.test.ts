import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, type TestDb } from '../../../shared/test-db'
import { LotsRepository } from '../lots.repository'
import { LotsService } from '../lots.service'
import { FieldsRepository } from '../../fields/fields.repository'
import { FieldsService } from '../../fields/fields.service'
import { tenants } from '../../../db'

describe('LotsService', () => {
  let lotsService: LotsService
  let fieldsService: FieldsService
  let db: TestDb
  const tenantId = '00000000-0000-0000-0000-000000000001'

  beforeEach(async () => {
    db = await createTestDb()
    await db.insert(tenants).values({ id: tenantId, name: 'Tenant A' })
    const fieldsRepo = new FieldsRepository(db)
    fieldsService = new FieldsService(fieldsRepo)
    lotsService = new LotsService(new LotsRepository(db), fieldsRepo)
  })

  it('crea un lote en un field del tenant', async () => {
    const field = await fieldsService.create(tenantId, { name: 'La Paloma' })
    const lot = await lotsService.create(field.id, tenantId, { name: 'Lote 1', hectares: 50 })
    expect(lot.name).toBe('Lote 1')
    expect(lot.fieldId).toBe(field.id)
  })

  it('lista los lotes de un field', async () => {
    const field = await fieldsService.create(tenantId, { name: 'La Paloma' })
    await lotsService.create(field.id, tenantId, { name: 'Lote A' })
    await lotsService.create(field.id, tenantId, { name: 'Lote B' })
    const result = await lotsService.getByField(field.id, tenantId)
    expect(result).toHaveLength(2)
  })

  it('no puede crear lote en field de otro tenant', async () => {
    const otherTenantId = '00000000-0000-0000-0000-000000000002'
    await db.insert(tenants).values({ id: otherTenantId, name: 'Otro' })
    const field = await fieldsService.create(tenantId, { name: 'Privado' })
    const otherFieldsRepo = new FieldsRepository(db)
    const otherService = new LotsService(new LotsRepository(db), otherFieldsRepo)
    await expect(otherService.create(field.id, otherTenantId, { name: 'Hack' })).rejects.toThrow('no encontrado')
  })

  it('actualiza nombre del lote', async () => {
    const field = await fieldsService.create(tenantId, { name: 'El Campo' })
    const lot = await lotsService.create(field.id, tenantId, { name: 'Viejo' })
    const updated = await lotsService.update(lot.id, tenantId, { name: 'Nuevo' })
    expect(updated.name).toBe('Nuevo')
  })

  it('elimina lote', async () => {
    const field = await fieldsService.create(tenantId, { name: 'El Campo' })
    const lot = await lotsService.create(field.id, tenantId, { name: 'Temporal' })
    await lotsService.delete(lot.id, tenantId)
    await expect(lotsService.getById(lot.id, tenantId)).rejects.toThrow('no encontrado')
  })
})
