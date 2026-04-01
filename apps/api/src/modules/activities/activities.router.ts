import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { createActivitySchema, updateActivitySchema, patchStatusSchema } from '../../validators/activities'
import { ActivitiesRepository } from './activities.repository'
import { ActivitiesService } from './activities.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'
import { ResponseHelper } from '../../shared/response'
import { paginationSchema, paginationToOffset } from '../../shared/pagination'

export function createActivitiesRouter() {
  const router = new Hono()
  const service = new ActivitiesService(new ActivitiesRepository(db))

  router.use('*', verifyAuth)

  router.get('/', async (c) => {
    const { tenantId } = c.get('user')
    const { lotId, campaignId, assignedTo, status } = c.req.query()
    const parsed = paginationSchema.safeParse(c.req.query())
    if (!parsed.success) return ResponseHelper.badRequest(c, 'Parámetros de paginación inválidos')
    const { page, pageSize } = parsed.data
    const { limit, offset } = paginationToOffset(page, pageSize)
    try {
      const result = await service.listPaginated(tenantId, {
        lotId, campaignId,
        assignedTo: assignedTo === 'null' ? null : assignedTo,
        status,
      }, limit, offset)
      return ResponseHelper.paginated(c, result.rows, { total: result.total, page, pageSize })
    } catch {
      return ResponseHelper.serverError(c, 'Error al obtener actividades')
    }
  })

  router.post('/', zValidator('json', createActivitySchema), async (c) => {
    const { sub: userId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.create(input, userId)
      return ResponseHelper.created(c, data)
    } catch (err) {
      return ResponseHelper.badRequest(c, err instanceof Error ? err.message : 'Error')
    }
  })

  router.get('/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      const data = await service.getById(c.req.param('id'), tenantId)
      return ResponseHelper.success(c, data)
    } catch {
      return ResponseHelper.notFound(c, 'Actividad no encontrada')
    }
  })

  router.put('/:id', zValidator('json', updateActivitySchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.update(c.req.param('id'), tenantId, input)
      return ResponseHelper.success(c, data)
    } catch {
      return ResponseHelper.notFound(c, 'Actividad no encontrada')
    }
  })

  router.patch('/:id/status', zValidator('json', patchStatusSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const data = await service.patchStatus(c.req.param('id'), tenantId, input)
      return ResponseHelper.success(c, data)
    } catch {
      return ResponseHelper.notFound(c, 'Actividad no encontrada')
    }
  })

  router.delete('/:id', async (c) => {
    const { tenantId } = c.get('user')
    try {
      await service.delete(c.req.param('id'), tenantId)
      return ResponseHelper.deleted(c)
    } catch {
      return ResponseHelper.notFound(c, 'Actividad no encontrada')
    }
  })

  return router
}
