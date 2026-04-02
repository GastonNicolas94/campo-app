'use client'
import { useEffect, useState } from 'react'
import { api, type TenantUser, type PaginatedResponse } from '@/lib/api'
import { Pagination } from '@/components/ui/Pagination'
import { Users } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  manager: 'Administrador',
  operator: 'Operador',
  accountant: 'Contador',
}

const PAGE_SIZE = 20

const inputClass = "w-full bg-surface border border-rim rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-brand transition-colors"

export default function TeamPage() {
  const [users, setUsers] = useState<TenantUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState<PaginatedResponse<TenantUser>['meta'] | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ email: '', password: '', phone: '', role: 'operator' as const })
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  // Leer usuario actual desde localStorage
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setCurrentUserId(user.id)
        setCurrentUserRole(user.role)
      }
    } catch {
      // silently fail
    }
  }, [])

  // Cargar lista de usuarios
  const load = async (pageNum: number = 1) => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.users.list({ page: pageNum, pageSize: PAGE_SIZE })
      setUsers(result.data)
      setMeta(result.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(page)
  }, [page])

  // Invitar nuevo usuario
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      await api.users.invite({
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        role: formData.role as 'manager' | 'operator' | 'accountant',
      })
      setFormData({ email: '', password: '', phone: '', role: 'operator' })
      setShowForm(false)
      await load(page)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al invitar usuario')
    } finally {
      setSaving(false)
    }
  }

  // Cambiar rol de usuario
  async function handleRoleChange(id: string, newRole: string) {
    try {
      await api.users.updateRole(id, newRole as 'manager' | 'operator' | 'accountant')
      await load(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar rol')
    }
  }

  // Eliminar usuario
  async function handleRemove(id: string) {
    if (!confirm('¿Estás seguro que quieres eliminar este usuario?')) return
    try {
      await api.users.remove(id)
      await load(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar usuario')
    }
  }

  // Mensaje de sin permisos
  if (currentUserRole && currentUserRole !== 'owner') {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-ink font-bold text-2xl">Equipo</h1>
        <div className="bg-card border border-rim rounded-2xl p-8 text-center">
          <p className="text-muted text-sm">No tenés permisos para gestionar el equipo. Solo los propietarios pueden acceder a esta sección.</p>
        </div>
      </div>
    )
  }

  // Si aún no se cargó el rol (loading)
  if (currentUserRole === null) {
    return <p className="text-muted text-center mt-16">Cargando...</p>
  }

  const cardClass = "bg-card border border-rim rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-ink font-bold text-2xl">Equipo</h1>
          <p className="text-muted text-sm mt-1">Gestiona los usuarios del tenant</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand hover:bg-brand-hover text-white font-medium text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Invitar usuario'}
        </button>
      </div>

      {/* Errores generales */}
      {error && (
        <div className="bg-danger-light border border-danger/20 rounded-2xl p-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Formulario de invitación */}
      {showForm && (
        <div className={cardClass}>
          <h2 className="text-sm font-semibold text-ink mb-4">Invitar nuevo usuario</h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink block mb-1.5">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@example.com"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink block mb-1.5">Contraseña</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Contraseña segura"
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink block mb-1.5">Teléfono (opcional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+54 9 11 1234 5678"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink block mb-1.5">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="operator">{ROLE_LABELS.operator}</option>
                  <option value="manager">{ROLE_LABELS.manager}</option>
                  <option value="accountant">{ROLE_LABELS.accountant}</option>
                </select>
              </div>
            </div>
            {formError && <p className="text-danger text-sm">{formError}</p>}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-muted hover:text-ink px-4 py-2 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-medium text-sm px-4 py-2 rounded-xl transition-colors"
              >
                {saving ? 'Invitando...' : 'Invitar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className={cardClass}>
        <h2 className="text-sm font-semibold text-ink mb-4">Usuarios del tenant</h2>
        {loading ? (
          <p className="text-muted text-center py-8 text-sm">Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p className="text-subtle text-center py-8 text-sm">No hay usuarios</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rim">
                    <th className="text-left py-3 px-3 font-medium text-muted">Email</th>
                    <th className="text-left py-3 px-3 font-medium text-muted">Teléfono</th>
                    <th className="text-left py-3 px-3 font-medium text-muted">Rol</th>
                    <th className="text-left py-3 px-3 font-medium text-muted">Creado</th>
                    <th className="text-right py-3 px-3 font-medium text-muted">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isOwner = user.role === 'owner'
                    const isCurrentUser = user.id === currentUserId
                    const canDelete = !isOwner && !isCurrentUser

                    return (
                      <tr key={user.id} className="border-b border-rim-subtle hover:bg-surface transition-colors">
                        <td className="py-3 px-3 text-ink">{user.email}</td>
                        <td className="py-3 px-3 text-muted">{user.phone || '-'}</td>
                        <td className="py-3 px-3">
                          {isOwner ? (
                            <span className="inline-block bg-brand-light text-brand px-2.5 py-1 rounded-md text-xs font-medium">
                              {ROLE_LABELS[user.role]}
                            </span>
                          ) : (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="bg-surface border border-rim rounded-lg px-2.5 py-1 text-xs font-medium text-ink focus:outline-none focus:border-brand transition-colors"
                            >
                              <option value="operator">{ROLE_LABELS.operator}</option>
                              <option value="manager">{ROLE_LABELS.manager}</option>
                              <option value="accountant">{ROLE_LABELS.accountant}</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-3 text-muted text-xs">
                          {new Date(user.createdAt).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {canDelete && (
                            <button
                              onClick={() => handleRemove(user.id)}
                              className="text-danger hover:bg-danger/10 px-2 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Eliminar
                            </button>
                          )}
                          {isCurrentUser && (
                            <span className="text-muted text-xs">Tu usuario</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {meta && meta.totalPages > 1 && (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
                pageSize={meta.pageSize}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
