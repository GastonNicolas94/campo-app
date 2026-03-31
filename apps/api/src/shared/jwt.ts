import { SignJWT, jwtVerify } from 'jose'
import type { JwtPayload } from '../types'

function getSecret(type: 'access' | 'refresh'): Uint8Array {
  const key = type === 'access' ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET
  if (!key) throw new Error(`Falta variable de entorno: ${type === 'access' ? 'JWT_SECRET' : 'JWT_REFRESH_SECRET'}`)
  return new TextEncoder().encode(key)
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret('access'))
}

export async function signRefreshToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret('refresh'))
}

export async function verifyToken(token: string, type: 'access' | 'refresh'): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecret(type))
  return payload as unknown as JwtPayload
}
