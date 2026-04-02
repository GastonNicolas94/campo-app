import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDb, type TestDb } from '../../../shared/test-db'
import { ActivitiesRepository } from '../activities.repository'
import { ActivitiesService } from '../activities.service'
import { tenants, users, fields, lots } from '../../../db'

let db: TestDb
let service: ActivitiesService

beforeEach(async () => {
  db = await createTestDb()
  service = new ActivitiesService(new ActivitiesRepository(db))
})

async function seed(db: TestDb) {
  const [tenantA] = await db.insert(tenants).values({ name: 'Tenant A' }).returning()
  const [tenantB] = await db.insert(tenants).values({ name: 'Tenant B' }).returning()
  const [userA] = await db.insert(users).values({ tenantId: tenantA.id, email: 'a@a.com', passwordHash: 'x', role: 'owner' }).returning()
  const [userB] = await db.insert(users).values({ tenantId: tenantB.id, email: 'b@b.com', passwordHash: 'x', role: 'owner' }).returning()
  const [fieldA] = await db.insert(fields).values({ tenantId: tenantA.id, name: 'Campo A' }).returning()
  const [lotA] = await db.insert(lots).values({ fieldId: fieldA.id, name: 'Lote 1' }).returning()
  return { tenantA, tenantB, userA, userB, fieldA, lotA }
}

describe('ActivitiesService', () => {
  it('crea una actividad y la lista', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    const act = await service.create({ title: 'Fumigar', lotId: lotA.id }, userA.id)
    expect(act.title).toBe('Fumigar')
    expect(act.status).toBe('pending')
    const list = await service.list(tenantA.id, {})
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(act.id)
  })

  it('no puede ver actividades de otro tenant', async () => {
    const { tenantB, userA, lotA } = await seed(db)
    await service.create({ title: 'Tarea', lotId: lotA.id }, userA.id)
    const list = await service.list(tenantB.id, {})
    expect(list).toHaveLength(0)
  })

  it('cambia estado a done con nota', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    const act = await service.create({ title: 'Regar', lotId: lotA.id }, userA.id)
    const updated = await service.patchStatus(act.id, tenantA.id, { status: 'done', completionNotes: 'Listo' })
    expect(updated.status).toBe('done')
    expect(updated.completionNotes).toBe('Listo')
    expect(updated.completedAt).toBeTruthy()
  })

  it('cambia estado a skipped', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    const act = await service.create({ title: 'Herbicida', lotId: lotA.id }, userA.id)
    const updated = await service.patchStatus(act.id, tenantA.id, { status: 'skipped' })
    expect(updated.status).toBe('skipped')
  })

  it('elimina una actividad', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    const act = await service.create({ title: 'Borrar', lotId: lotA.id }, userA.id)
    await service.delete(act.id, tenantA.id)
    const list = await service.list(tenantA.id, {})
    expect(list).toHaveLength(0)
  })

  it('pagina actividades correctamente', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    await service.create({ title: 'Actividad 1', lotId: lotA.id }, userA.id)
    await service.create({ title: 'Actividad 2', lotId: lotA.id }, userA.id)
    await service.create({ title: 'Actividad 3', lotId: lotA.id }, userA.id)

    const page1 = await service.listPaginated(tenantA.id, {}, 2, 0)
    expect(page1.rows).toHaveLength(2)
    expect(page1.total).toBe(3)

    const page2 = await service.listPaginated(tenantA.id, {}, 2, 2)
    expect(page2.rows).toHaveLength(1)
    expect(page2.total).toBe(3)
  })

  it('crea actividad con type y lo persiste correctamente', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    const act = await service.create({ title: 'Siembra', lotId: lotA.id, type: 'siembra' }, userA.id)
    expect(act.type).toBe('siembra')
    const fetched = await service.getById(act.id, tenantA.id)
    expect(fetched.type).toBe('siembra')
  })

  it('crea actividad sin type y type es null', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    const act = await service.create({ title: 'Sin tipo', lotId: lotA.id }, userA.id)
    expect(act.type).toBeNull()
  })

  it('filtra actividades por type correctamente', async () => {
    const { tenantA, userA, lotA } = await seed(db)
    await service.create({ title: 'Siembra 1', lotId: lotA.id, type: 'siembra' }, userA.id)
    await service.create({ title: 'Siembra 2', lotId: lotA.id, type: 'siembra' }, userA.id)
    await service.create({ title: 'Riego 1', lotId: lotA.id, type: 'riego' }, userA.id)
    await service.create({ title: 'Sin tipo', lotId: lotA.id }, userA.id)

    const siembras = await service.list(tenantA.id, { type: 'siembra' })
    expect(siembras).toHaveLength(2)
    expect(siembras.every(a => a.type === 'siembra')).toBe(true)

    const riegos = await service.list(tenantA.id, { type: 'riego' })
    expect(riegos).toHaveLength(1)
    expect(riegos[0].type).toBe('riego')
  })
})
