import { createMiddleware } from 'hono/factory'
import { verifyToken } from '../jwt'
import { ResponseHelper } from '../response'
import type { JwtPayload } from '../../types'

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload
  }
}

export const verifyAuth = createMiddleware(async (c, next) => {
  const authorization = c.req.header('Authorization')
  if (!authorization?.startsWith('Bearer ')) {
    return ResponseHelper.unauthorized(c, 'No autorizado')
  }

  const token = authorization.slice(7)
  try {
    const payload = await verifyToken(token, 'access')
    c.set('user', payload)
    await next()
  } catch {
    return ResponseHelper.unauthorized(c, 'Token inválido o expirado')
  }
})
