import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, type TestDb } from '../../../shared/test-db'
import { StockRepository } from '../stock.repository'
import { StockService } from '../stock.service'
import { tenants, users, fields } from '@campo-app/db'

let db: TestDb
let service: StockService

beforeEach(async () => {
  db = await createTestDb()
  service = new StockService(new StockRepository(db))
})

async function seed(db: TestDb) {
  const [tenantA] = await db.insert(tenants).values({ name: 'Tenant A' }).returning()
  const [tenantB] = await db.insert(tenants).values({ name: 'Tenant B' }).returning()
  const [userA] = await db.insert(users).values({ tenantId: tenantA.id, email: 'a@a.com', passwordHash: 'x', role: 'owner' }).returning()
  const [fieldA] = await db.insert(fields).values({ tenantId: tenantA.id, name: 'Campo A' }).returning()
  const [fieldB] = await db.insert(fields).values({ tenantId: tenantB.id, name: 'Campo B' }).returning()
  return { tenantA, tenantB, userA, fieldA, fieldB }
}

describe('StockService', () => {
  it('crea un item y lo lista', async () => {
    const { tenantA, fieldA } = await seed(db)
    const item = await service.create({ fieldId: fieldA.id, name: 'Glifosato', category: 'agroquimico', unit: 'L', currentQuantity: 100 })
    expect(item.name).toBe('Glifosato')
    const list = await service.listByTenant(tenantA.id)
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(item.id)
  })

  it('no lista items de otro tenant', async () => {
    const { tenantB, fieldA } = await seed(db)
    await service.create({ fieldId: fieldA.id, name: 'Semilla', category: 'semilla', unit: 'kg', currentQuantity: 50 })
    const list = await service.listByTenant(tenantB.id)
    expect(list).toHaveLength(0)
  })

  it('registra entrada y actualiza cantidad', async () => {
    const { tenantA, userA, fieldA } = await seed(db)
    const item = await service.create({ fieldId: fieldA.id, name: 'Diesel', category: 'combustible', unit: 'L', currentQuantity: 0 })
    const result = await service.addMovement(item.id, tenantA.id, { type: 'in', quantity: 200, date: '2026-01-01' }, userA.id)
    expect(Number(result.item?.currentQuantity)).toBe(200)
    expect(result.alert).toBe(false)
  })

  it('registra salida y detecta alerta de umbral', async () => {
    const { tenantA, userA, fieldA } = await seed(db)
    const item = await service.create({ fieldId: fieldA.id, name: 'Fertilizante', category: 'fertilizante', unit: 'kg', currentQuantity: 100, alertThreshold: 20 })
    const result = await service.addMovement(item.id, tenantA.id, { type: 'out', quantity: 90, date: '2026-01-01' }, userA.id)
    expect(Number(result.item?.currentQuantity)).toBe(10)
    expect(result.alert).toBe(true)
  })

  it('no permite salida que deje stock negativo', async () => {
    const { tenantA, userA, fieldA } = await seed(db)
    const item = await service.create({ fieldId: fieldA.id, name: 'Repuesto', category: 'repuesto', unit: 'u', currentQuantity: 5 })
    await expect(
      service.addMovement(item.id, tenantA.id, { type: 'out', quantity: 10, date: '2026-01-01' }, userA.id)
    ).rejects.toThrow('Stock insuficiente')
  })

  it('lista items con alerta activa', async () => {
    const { tenantA, userA, fieldA } = await seed(db)
    await service.create({ fieldId: fieldA.id, name: 'OK', category: 'otro', unit: 'u', currentQuantity: 100, alertThreshold: 10 })
    const bajo = await service.create({ fieldId: fieldA.id, name: 'Bajo', category: 'semilla', unit: 'kg', currentQuantity: 5, alertThreshold: 10 })
    const alerts = await service.getAlerts(tenantA.id)
    expect(alerts).toHaveLength(1)
    expect(alerts[0].id).toBe(bajo.id)
  })
})
