import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { registerSchema, loginSchema, refreshSchema } from '../../validators/auth'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'
import { ResponseHelper } from '../../shared/response'

export function createAuthRouter() {
  const router = new Hono()
  const repo = new AuthRepository(db)
  const service = new AuthService(repo)

  router.post('/register', zValidator('json', registerSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const result = await service.register(input)
      return ResponseHelper.created(c, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar'
      return ResponseHelper.badRequest(c, message)
    }
  })

  router.post('/login', zValidator('json', loginSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const result = await service.login(input)
      return ResponseHelper.success(c, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al autenticar'
      return ResponseHelper.unauthorized(c, message)
    }
  })

  router.post('/refresh', zValidator('json', refreshSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const result = await service.refresh(input)
      return ResponseHelper.success(c, result)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refresh token inválido'
      return ResponseHelper.unauthorized(c, message)
    }
  })

  return router
}
