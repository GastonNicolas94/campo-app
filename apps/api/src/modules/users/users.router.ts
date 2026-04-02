import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { inviteUserSchema, updateUserRoleSchema } from '../../validators/users'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { ResponseHelper } from '../../shared/response'
import { paginationSchema } from '../../shared/pagination'
import { db } from '../../shared/db'

export function createUsersRouter() {
  const router = new Hono()
  const service = new UsersService(new UsersRepository(db))

  router.use('*', verifyAuth)

  // Middleware: solo owner puede gestionar usuarios
  router.use('*', async (c, next) => {
    if (c.get('user').role !== 'owner') {
      return ResponseHelper.unauthorized(c, 'Solo el owner puede gestionar usuarios')
    }
    await next()
  })

  // GET /users
  router.get('/', async (c) => {
    const { tenantId } = c.get('user')
    const parsed = paginationSchema.safeParse(c.req.query())
    if (!parsed.success) return ResponseHelper.badRequest(c, 'Parámetros inválidos')
    const { page, pageSize } = parsed.data
    try {
      const result = await service.list(tenantId, page, pageSize)
      return ResponseHelper.paginated(c, result.rows, { total: result.total, page, pageSize })
    } catch {
      return ResponseHelper.serverError(c, 'Error al obtener usuarios')
    }
  })

  // POST /users/invite
  router.post('/invite', zValidator('json', inviteUserSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const user = await service.invite(tenantId, input)
      return ResponseHelper.created(c, { id: user.id, email: user.email, role: user.role })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      if (message.includes('ya está registrado')) return ResponseHelper.conflict(c, message)
      if (message.includes('no encontrado')) return ResponseHelper.notFound(c, message)
      return ResponseHelper.serverError(c, message)
    }
  })

  // PUT /users/:id/role
  router.put('/:id/role', zValidator('json', updateUserRoleSchema), async (c) => {
    const { tenantId } = c.get('user')
    const input = c.req.valid('json')
    try {
      const user = await service.updateRole(c.req.param('id'), tenantId, input)
      return ResponseHelper.success(c, { id: user!.id, email: user!.email, role: user!.role })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return message.includes('no encontrado')
        ? ResponseHelper.notFound(c, message)
        : ResponseHelper.badRequest(c, message)
    }
  })

  // DELETE /users/:id
  router.delete('/:id', async (c) => {
    const { tenantId, sub: requesterId } = c.get('user')
    try {
      await service.remove(c.req.param('id'), tenantId, requesterId)
      return ResponseHelper.deleted(c)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return message.includes('no encontrado')
        ? ResponseHelper.notFound(c, message)
        : ResponseHelper.badRequest(c, message)
    }
  })

  return router
}
