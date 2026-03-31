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

// --- Types ---
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

export interface Field { id: string; name: string; location?: string; totalHectares?: string; createdAt: string }
export interface Lot { id: string; fieldId: string; name: string; hectares?: string; createdAt: string }
export interface Campaign { id: string; lotId: string; crop: string; variety?: string; sowingDate: string; harvestDate?: string; status: 'active' | 'closed'; createdAt: string }
export interface Activity { id: string; title: string; description?: string; status: 'pending' | 'done' | 'skipped'; dueDate?: string; lotId?: string; campaignId?: string; assignedTo?: string; completionNotes?: string; completedAt?: string; createdAt: string }
export interface StockItem { id: string; fieldId: string; name: string; category: string; unit: string; currentQuantity: string; alertThreshold?: string; createdAt: string }
export interface StockMovement { id: string; itemId: string; type: 'in' | 'out'; quantity: string; date: string; reason?: string; createdAt: string }

export interface ReportSummary {
  kpis: {
    totalFields: number
    totalLots: number
    activeCampaigns: number
    pendingActivities: number
    stockAlerts: number
  }
  activitiesByStatus: Array<{ status: string; count: number }>
  campaignsByCrop: Array<{ crop: string; count: number }>
  stockByCategory: Array<{ category: string; totalQuantity: number; itemCount: number }>
  campaignYields: Array<{ crop: string; variety: string | null; yieldAmount: string; yieldUnit: string; harvestDate: string }>
}

export const api = {
  auth: {
    register: (body: unknown) => request<AuthResult>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body: unknown) => request<AuthResult>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    refresh: (refreshToken: string) =>
      request<{ accessToken: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
    me: () => request<MeResult>('/me'),
  },
  fields: {
    list: () => request<Field[]>('/fields'),
    getById: (id: string) => request<Field>(`/fields/${id}`),
    create: (body: { name: string; location?: string; totalHectares?: string }) =>
      request<Field>('/fields', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; location: string; totalHectares: string }>) =>
      request<Field>(`/fields/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/fields/${id}`, { method: 'DELETE' }),
    lots: (fieldId: string) => request<Lot[]>(`/fields/${fieldId}/lots`),
    createLot: (fieldId: string, body: { name: string; hectares?: string }) =>
      request<Lot>(`/fields/${fieldId}/lots`, { method: 'POST', body: JSON.stringify({ ...body, hectares: body.hectares ? Number(body.hectares) : undefined }) }),
  },
  lots: {
    getById: (id: string) => request<Lot>(`/lots/${id}`),
    update: (id: string, body: Partial<{ name: string; hectares: string }>) =>
      request<Lot>(`/lots/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/lots/${id}`, { method: 'DELETE' }),
    campaigns: (lotId: string) => request<Campaign[]>(`/lots/${lotId}/campaigns`),
    createCampaign: (lotId: string, body: { crop: string; variety?: string; sowingDate: string; harvestDate?: string }) =>
      request<Campaign>(`/lots/${lotId}/campaigns`, { method: 'POST', body: JSON.stringify(body) }),
  },
  campaigns: {
    getById: (id: string) => request<Campaign>(`/campaigns/${id}`),
    update: (id: string, body: Partial<{ crop: string; variety: string; harvestDate: string }>) =>
      request<Campaign>(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    closeWithResult: (id: string, body: { yieldAmount?: number; yieldUnit?: 'qq_ha' | 'tn_ha'; totalRevenue?: number; notes?: string }) =>
      request<Campaign>(`/campaigns/${id}/results`, { method: 'POST', body: JSON.stringify(body) }),
  },
  activities: {
    list: (params?: { lotId?: string; campaignId?: string; status?: string }) => {
      const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null) as [string, string][])).toString() : ''
      return request<Activity[]>(`/activities${qs}`)
    },
    getById: (id: string) => request<Activity>(`/activities/${id}`),
    create: (body: { title: string; description?: string; lotId?: string; campaignId?: string; dueDate?: string }) =>
      request<Activity>('/activities', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ title: string; description: string; dueDate: string }>) =>
      request<Activity>(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    patchStatus: (id: string, body: { status: 'done' | 'skipped'; completionNotes?: string }) =>
      request<Activity>(`/activities/${id}/status`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/activities/${id}`, { method: 'DELETE' }),
  },
  stock: {
    list: (fieldId?: string) => {
      const qs = fieldId ? `?fieldId=${fieldId}` : ''
      return request<StockItem[]>(`/stock/items${qs}`)
    },
    getById: (id: string) => request<StockItem>(`/stock/items/${id}`),
    create: (body: { fieldId: string; name: string; category: string; unit: string; currentQuantity: number; alertThreshold?: number }) =>
      request<StockItem>('/stock/items', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<{ name: string; category: string; unit: string; alertThreshold: number }>) =>
      request<StockItem>(`/stock/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/stock/items/${id}`, { method: 'DELETE' }),
    addMovement: (id: string, body: { type: 'in' | 'out'; quantity: number; date: string; reason?: string }) =>
      request<{ movement: StockMovement; item: StockItem; alert: boolean }>(`/stock/items/${id}/movements`, { method: 'POST', body: JSON.stringify(body) }),
    getMovements: (id: string) => request<StockMovement[]>(`/stock/items/${id}/movements`),
    alerts: () => request<StockItem[]>('/stock/alerts'),
  },
  reports: {
    summary: (params?: { dateFrom?: string; dateTo?: string; fieldId?: string; crop?: string; stockCategory?: string }) => {
      const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '') as [string, string][])).toString() : ''
      return request<ReportSummary>(`/reports/summary${qs}`)
    },
    download: async (params: { format: 'excel' | 'pdf'; dateFrom?: string; dateTo?: string; fieldId?: string; crop?: string; stockCategory?: string; modules?: string; lotId?: string }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const qs = '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '') as [string, string][])).toString()
      const res = await fetch(`${API_URL}/reports/export${qs}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte-campo-${new Date().toISOString().split('T')[0]}.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    },
  },
}
