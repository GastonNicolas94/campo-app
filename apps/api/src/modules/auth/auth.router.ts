import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { registerSchema, loginSchema, refreshSchema } from '@campo-app/validators/auth'
import { AuthRepository } from './auth.repository'
import { AuthService } from './auth.service'
import { verifyAuth } from '../../shared/middleware/auth.middleware'
import { db } from '../../shared/db'

export function createAuthRouter() {
  const router = new Hono()
  const repo = new AuthRepository(db)
  const service = new AuthService(repo)

  router.post('/register', zValidator('json', registerSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const result = await service.register(input)
      return c.json({ data: result }, 201)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar'
      return c.json({ error: message }, 400)
    }
  })

  router.post('/login', zValidator('json', loginSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const result = await service.login(input)
      return c.json({ data: result })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al autenticar'
      return c.json({ error: message }, 401)
    }
  })

  router.post('/refresh', zValidator('json', refreshSchema), async (c) => {
    const input = c.req.valid('json')
    try {
      const result = await service.refresh(input)
      return c.json({ data: result })
    } catch {
      return c.json({ error: 'Refresh token inválido' }, 401)
    }
  })

  return router
}
