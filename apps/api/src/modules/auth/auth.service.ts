import bcrypt from 'bcryptjs'
import { signAccessToken, signRefreshToken, verifyToken } from '../../shared/jwt'
import type { AuthRepository } from './auth.repository'
import type { RegisterInput, LoginInput, RefreshInput } from '@campo-app/validators/auth'

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async register(input: RegisterInput) {
    const existing = await this.repo.findByEmail(input.email)
    if (existing) throw new Error('El email ya está registrado')

    const tenant = await this.repo.createTenant({ name: input.tenantName })
    const passwordHash = await bcrypt.hash(input.password, 10)

    const user = await this.repo.createUser({
      tenantId: tenant.id,
      email: input.email,
      passwordHash,
      phone: input.phone ?? null,
      role: 'owner',
    })

    const jwtPayload = { sub: user.id, tenantId: tenant.id, role: user.role }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(jwtPayload),
      signRefreshToken(jwtPayload),
    ])

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    }
  }

  async login(input: LoginInput) {
    const user = await this.repo.findByEmail(input.email)
    if (!user) throw new Error('Credenciales inválidas')

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw new Error('Credenciales inválidas')

    const jwtPayload = { sub: user.id, tenantId: user.tenantId, role: user.role }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(jwtPayload),
      signRefreshToken(jwtPayload),
    ])

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    }
  }

  async refresh(input: RefreshInput) {
    const payload = await verifyToken(input.refreshToken, 'refresh')
    const user = await this.repo.findById(payload.sub)
    if (!user) throw new Error('Usuario no encontrado')

    const jwtPayload = { sub: user.id, tenantId: user.tenantId, role: user.role }
    const accessToken = await signAccessToken(jwtPayload)
    return { accessToken }
  }
}
