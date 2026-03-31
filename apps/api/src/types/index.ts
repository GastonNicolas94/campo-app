export type Role = 'owner' | 'manager' | 'operator' | 'accountant'

export interface Tenant {
  id: string
  name: string
  createdAt: Date
}

export interface User {
  id: string
  tenantId: string
  email: string
  phone: string | null
  role: Role
  createdAt: Date
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: string
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// Shape del JWT payload
export interface JwtPayload {
  sub: string       // userId
  tenantId: string
  role: Role
}
