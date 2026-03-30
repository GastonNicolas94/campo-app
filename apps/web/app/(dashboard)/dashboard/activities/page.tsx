'use client'
import { useEffect, useState } from 'react'
import { api, type Activity, type Lot } from '@/lib/api'

const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', done: 'Completada', skipped: 'Omitida' }
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  done: 'bg-green-500/20 text-green-400',
  skipped: 'bg-zinc-700 text-zinc-400',
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterLot, setFilterLot] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formLotId, setFormLotId] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.status = filterStatus
      if (filterLot) params.lotId = filterLot
      const [acts, fields] = await Promise.all([api.activities.list(params), api.fields.list()])
      setActivities(acts)
      if (fields.length > 0) {
        const allLots = await Promise.all(fields.map(f => api.fields.lots(f.id)))
        setLots(allLots.flat())
      }
    } catch {
      setError('Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterStatus, filterLot])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.activities.create({
        title: formTitle,
        description: formDesc || undefined,
        lotId: formLotId || undefined,
        dueDate: formDueDate || undefined,
      })
      setFormTitle(''); setFormDesc(''); setFormLotId(''); setFormDueDate(''); setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePatchStatus(id: string, status: 'done' | 'skipped') {
    try {
      await api.activities.patchStatus(id, { status })
      await load()
    } catch {}
  }

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Actividades</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          + Nueva
        </button>
      </div>

      <div className="flex gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="done">Completada</option>
          <option value="skipped">Omitida</option>
        </select>
        <select value={filterLot} onChange={e => setFilterLot(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
        >
          <option value="">Todos los lotes</option>
          {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium">Nueva actividad</h2>
          <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
            placeholder="Título *" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)}
            placeholder="Descripción (opcional)" rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-zinc-500"
          />
          <select value={formLotId} onChange={e => setFormLotId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Sin lote asignado</option>
            {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Fecha de vencimiento (opcional)</label>
            <input value={formDueDate} onChange={e => setFormDueDate(e.target.value)}
              type="date"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-zinc-400 hover:text-zinc-200 text-sm px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {activities.length === 0 ? (
        <p className="text-zinc-500 text-center mt-12">No hay actividades</p>
      ) : (
        <ul className="space-y-2">
          {activities.map(act => (
            <li key={act.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{act.title}</p>
                  {act.description && <p className="text-sm text-zinc-400 mt-0.5 truncate">{act.description}</p>}
                  {act.dueDate && <p className="text-xs text-zinc-500 mt-1">Vence: {act.dueDate}</p>}
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded ${STATUS_COLORS[act.status]}`}>
                  {STATUS_LABELS[act.status]}
                </span>
              </div>
              {act.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handlePatchStatus(act.id, 'done')}
                    className="text-xs bg-green-600/20 hover:bg-green-600/40 text-green-400 px-3 py-1 rounded-lg transition-colors"
                  >
                    Marcar hecha
                  </button>
                  <button onClick={() => handlePatchStatus(act.id, 'skipped')}
                    className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1 rounded-lg transition-colors"
                  >
                    Omitir
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
