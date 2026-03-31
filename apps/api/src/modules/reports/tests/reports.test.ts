import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, type TestDb } from '../../../shared/test-db'
import { ReportsRepository } from '../reports.repository'
import { tenants, users, fields, lots, campaigns, campaignResults, activities, stockItems } from '../../../db'

let db: TestDb
let repo: ReportsRepository

beforeEach(async () => {
  db = await createTestDb()
  repo = new ReportsRepository(db)
})

async function seed(db: TestDb) {
  const [tenantA] = await db.insert(tenants).values({ name: 'Tenant A' }).returning()
  const [tenantB] = await db.insert(tenants).values({ name: 'Tenant B' }).returning()
  const [userA] = await db.insert(users).values({ tenantId: tenantA.id, email: 'a@a.com', passwordHash: 'x', role: 'owner' }).returning()
  const [fieldA] = await db.insert(fields).values({ tenantId: tenantA.id, name: 'Campo A' }).returning()
  const [lotA] = await db.insert(lots).values({ fieldId: fieldA.id, name: 'Lote 1' }).returning()
  const [campA] = await db.insert(campaigns).values({ lotId: lotA.id, crop: 'Soja', sowingDate: '2025-10-01', status: 'active' }).returning()
  const [campB] = await db.insert(campaigns).values({ lotId: lotA.id, crop: 'Maíz', sowingDate: '2025-11-01', status: 'closed', harvestDate: '2026-02-01' }).returning()
  await db.insert(campaignResults).values({ campaignId: campB.id, yieldAmount: '38', yieldUnit: 'qq_ha' })
  await db.insert(activities).values({ lotId: lotA.id, campaignId: campA.id, createdBy: userA.id, title: 'Riego', status: 'pending' })
  await db.insert(activities).values({ lotId: lotA.id, campaignId: campA.id, createdBy: userA.id, title: 'Fumigación', status: 'done' })
  await db.insert(stockItems).values({ fieldId: fieldA.id, name: 'Glifosato', category: 'agroquimico', unit: 'L', currentQuantity: '5', alertThreshold: '10' })
  await db.insert(stockItems).values({ fieldId: fieldA.id, name: 'Diesel', category: 'combustible', unit: 'L', currentQuantity: '500' })
  return { tenantA, tenantB, userA, fieldA, lotA, campA, campB }
}

describe('ReportsRepository', () => {
  it('getKpis returns correct counts for tenant', async () => {
    const { tenantA } = await seed(db)
    const kpis = await repo.getKpis(tenantA.id, {})
    expect(kpis.totalFields).toBe(1)
    expect(kpis.totalLots).toBe(1)
    expect(kpis.activeCampaigns).toBe(1)
    expect(kpis.pendingActivities).toBe(1)
    expect(kpis.stockAlerts).toBe(1)
  })

  it('getKpis does not expose other tenant data', async () => {
    const { tenantB } = await seed(db)
    const kpis = await repo.getKpis(tenantB.id, {})
    expect(kpis.totalFields).toBe(0)
    expect(kpis.activeCampaigns).toBe(0)
    expect(kpis.pendingActivities).toBe(0)
  })

  it('getActivitiesByStatus groups correctly', async () => {
    const { tenantA } = await seed(db)
    const result = await repo.getActivitiesByStatus(tenantA.id, {})
    const pending = result.find(r => r.status === 'pending')
    const done = result.find(r => r.status === 'done')
    expect(pending?.count).toBe(1)
    expect(done?.count).toBe(1)
  })

  it('getCampaignsByCrop groups by crop name', async () => {
    const { tenantA } = await seed(db)
    const result = await repo.getCampaignsByCrop(tenantA.id, {})
    expect(result).toHaveLength(2)
    const soja = result.find(r => r.crop === 'Soja')
    expect(soja?.count).toBe(1)
  })

  it('getStockByCategory aggregates by category', async () => {
    const { tenantA } = await seed(db)
    const result = await repo.getStockByCategory(tenantA.id, {})
    expect(result.find(r => r.category === 'agroquimico')?.itemCount).toBe(1)
    expect(result.find(r => r.category === 'combustible')?.itemCount).toBe(1)
  })

  it('getCampaignYields returns closed campaigns with results', async () => {
    const { tenantA } = await seed(db)
    const result = await repo.getCampaignYields(tenantA.id, {})
    expect(result).toHaveLength(1)
    expect(result[0].crop).toBe('Maíz')
    expect(Number(result[0].yieldAmount)).toBeCloseTo(38)
  })
})
