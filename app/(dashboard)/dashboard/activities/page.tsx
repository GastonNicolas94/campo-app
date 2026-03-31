'use client'
import { useEffect, useState } from 'react'
import { api, type Activity, type Lot } from '@/lib/api'

const STATUS_LABELS: Record<string, string> = { pending: 'Pendiente', done: 'Completada', skipped: 'Omitida' }
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-accent-light text-accent',
  done: 'bg-brand-light text-brand',
  skipped: 'bg-rim-subtle text-muted',
}

const inputClass = "bg-white border border-rim rounded-xl px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-colors"
const formInputClass = "w-full bg-surface border border-rim rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-brand transition-colors"

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
  const [exporting, setExporting] = useState(false)
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

  async function handleExport() {
    setExporting(true)
    try {
      await api.reports.download({ format: 'excel', modules: 'activities' })
    } catch {} finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-ink font-bold text-2xl">Actividades</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="bg-card hover:bg-rim-subtle disabled:opacity-50 text-muted hover:text-ink border border-rim text-sm px-3 py-2 rounded-xl transition-colors"
          >
            {exporting ? '...' : '↓ Excel'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand-hover text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"
          >
            + Nueva
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputClass}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="done">Completada</option>
          <option value="skipped">Omitida</option>
        </select>
        <select value={filterLot} onChange={e => setFilterLot(e.target.value)} className={inputClass}>
          <option value="">Todos los lotes</option>
          {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-rim rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-ink">Nueva actividad</h2>
          <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
            placeholder="Título *" required className={formInputClass}
          />
          <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)}
            placeholder="Descripción (opcional)" rows={2}
            className={`${formInputClass} resize-none`}
          />
          <select value={formLotId} onChange={e => setFormLotId(e.target.value)} className={formInputClass}>
            <option value="">Sin lote asignado</option>
            {lots.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <div>
            <label className="text-xs text-muted block mb-1">Fecha de vencimiento (opcional)</label>
            <input value={formDueDate} onChange={e => setFormDueDate(e.target.value)}
              type="date" className={formInputClass}
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-muted hover:text-ink text-sm px-4 py-2.5"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {activities.length === 0 ? (
        <p className="text-subtle text-center mt-12">No hay actividades</p>
      ) : (
        <ul className="space-y-2">
          {activities.map(act => (
            <li key={act.id} className="bg-card border border-rim rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{act.title}</p>
                  {act.description && <p className="text-sm text-muted mt-0.5 truncate">{act.description}</p>}
                  {act.dueDate && <p className="text-xs text-subtle mt-1">Vence: {act.dueDate}</p>}
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg font-medium ${STATUS_COLORS[act.status]}`}>
                  {STATUS_LABELS[act.status]}
                </span>
              </div>
              {act.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => handlePatchStatus(act.id, 'done')}
                    className="text-xs bg-brand-light hover:bg-brand/20 text-brand px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    Marcar hecha
                  </button>
                  <button onClick={() => handlePatchStatus(act.id, 'skipped')}
                    className="text-xs bg-rim-subtle hover:bg-rim text-muted px-3 py-1.5 rounded-lg transition-colors"
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
