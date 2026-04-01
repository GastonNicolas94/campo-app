import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, type TestDb } from '../../../shared/test-db'
import { CampaignsRepository } from '../campaigns.repository'
import { CampaignsService } from '../campaigns.service'
import { LotsRepository } from '../../lots/lots.repository'
import { FieldsRepository } from '../../fields/fields.repository'
import { FieldsService } from '../../fields/fields.service'
import { LotsService } from '../../lots/lots.service'
import { tenants } from '../../../db'

describe('CampaignsService', () => {
  let campaignsService: CampaignsService
  let db: TestDb
  let lotId: string
  const tenantId = '00000000-0000-0000-0000-000000000001'

  beforeEach(async () => {
    db = await createTestDb()
    await db.insert(tenants).values({ id: tenantId, name: 'Tenant A' })

    const fieldsRepo = new FieldsRepository(db)
    const lotsRepo = new LotsRepository(db)
    const fieldsService = new FieldsService(fieldsRepo)
    const lotsService = new LotsService(lotsRepo, fieldsRepo)
    campaignsService = new CampaignsService(new CampaignsRepository(db), lotsRepo)

    const field = await fieldsService.create(tenantId, { name: 'El Campo' })
    const lot = await lotsService.create(field.id, tenantId, { name: 'Lote 1' })
    lotId = lot.id
  })

  it('crea una campaña', async () => {
    const campaign = await campaignsService.create(lotId, tenantId, {
      crop: 'Soja',
      sowingDate: '2024-10-01',
    })
    expect(campaign.crop).toBe('Soja')
    expect(campaign.status).toBe('active')
  })

  it('lista campañas de un lote', async () => {
    await campaignsService.create(lotId, tenantId, { crop: 'Soja', sowingDate: '2024-10-01' })
    await campaignsService.create(lotId, tenantId, { crop: 'Maíz', sowingDate: '2024-11-01' })
    const list = await campaignsService.getByLot(lotId, tenantId)
    expect(list).toHaveLength(2)
  })

  it('cierra campaña con resultado', async () => {
    const campaign = await campaignsService.create(lotId, tenantId, {
      crop: 'Soja',
      sowingDate: '2024-10-01',
    })
    const result = await campaignsService.close(campaign.id, tenantId, {
      yieldAmount: 35,
      yieldUnit: 'qq_ha',
      totalRevenue: 15000,
    })
    expect(result.yieldUnit).toBe('qq_ha')
  })

  it('no puede cerrar campaña ya cerrada', async () => {
    const campaign = await campaignsService.create(lotId, tenantId, {
      crop: 'Soja',
      sowingDate: '2024-10-01',
    })
    await campaignsService.close(campaign.id, tenantId, { yieldAmount: 35, yieldUnit: 'qq_ha' })
    await expect(
      campaignsService.close(campaign.id, tenantId, { yieldAmount: 40, yieldUnit: 'qq_ha' })
    ).rejects.toThrow('ya está cerrada')
  })

  it('no permite crear dos campañas activas del mismo cultivo en el mismo lote', async () => {
    await campaignsService.create(lotId, tenantId, {
      crop: 'Soja',
      sowingDate: '2024-10-01',
    })
    await expect(
      campaignsService.create(lotId, tenantId, {
        crop: 'Soja',
        sowingDate: '2024-11-01',
      })
    ).rejects.toThrow('Ya existe una campaña activa para este cultivo en este lote')
  })

  it('permite crear campañas activas de diferentes cultivos en el mismo lote', async () => {
    await campaignsService.create(lotId, tenantId, {
      crop: 'Soja',
      sowingDate: '2024-10-01',
    })
    const second = await campaignsService.create(lotId, tenantId, {
      crop: 'Maíz',
      sowingDate: '2024-10-01',
    })
    expect(second.crop).toBe('Maíz')
  })

  it('pagina campañas correctamente', async () => {
    await campaignsService.create(lotId, tenantId, { crop: 'Soja', sowingDate: '2024-10-01' })
    await campaignsService.create(lotId, tenantId, { crop: 'Maíz', sowingDate: '2024-11-01' })
    await campaignsService.create(lotId, tenantId, { crop: 'Trigo', sowingDate: '2024-12-01' })

    const page1 = await campaignsService.getByLotPaginated(lotId, tenantId, 2, 0)
    expect(page1.rows).toHaveLength(2)
    expect(page1.total).toBe(3)

    const page2 = await campaignsService.getByLotPaginated(lotId, tenantId, 2, 2)
    expect(page2.rows).toHaveLength(1)
    expect(page2.total).toBe(3)
  })
})
