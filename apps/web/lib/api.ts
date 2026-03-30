const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Error en la solicitud')
  return json.data as T
}

interface AuthResult {
  accessToken: string
  refreshToken: string
  user: { id: string; email: string; role: string }
}

interface MeResult {
  id: string
  tenantId: string
  email: string
  role: string
}

export const api = {
  auth: {
    register: (body: unknown) => request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: unknown) => request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    refresh: (refreshToken: string) =>
      request<{ accessToken: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    me: () => request<MeResult>('/auth/me'),
  },
}
