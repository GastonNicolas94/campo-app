'use client'
import { useEffect, useState } from 'react'
import { api, type StockItem, type Field } from '@/lib/api'

const CATEGORIES: Record<string, string> = {
  agroquimico: 'Agroquímico', semilla: 'Semilla', combustible: 'Combustible',
  fertilizante: 'Fertilizante', repuesto: 'Repuesto', otro: 'Otro',
}

const inputClass = "w-full bg-surface border border-rim rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-brand transition-colors"

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [alerts, setAlerts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [movementItem, setMovementItem] = useState<StockItem | null>(null)

  const [fName, setFName] = useState('')
  const [fCategory, setFCategory] = useState('agroquimico')
  const [fUnit, setFUnit] = useState('')
  const [fQty, setFQty] = useState('0')
  const [fThreshold, setFThreshold] = useState('')
  const [fFieldId, setFFieldId] = useState('')

  const [mType, setMType] = useState<'in' | 'out'>('in')
  const [mQty, setMQty] = useState('')
  const [mDate, setMDate] = useState(new Date().toISOString().split('T')[0])
  const [mReason, setMReason] = useState('')

  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  async function load() {
    try {
      const [its, als, fs] = await Promise.all([api.stock.list(), api.stock.alerts(), api.fields.list()])
      setItems(its)
      setAlerts(new Set(als.map(a => a.id)))
      setFields(fs)
      if (fs.length > 0 && !fFieldId) setFFieldId(fs[0].id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.stock.create({
        fieldId: fFieldId,
        name: fName,
        category: fCategory,
        unit: fUnit,
        currentQuantity: Number(fQty),
        alertThreshold: fThreshold ? Number(fThreshold) : undefined,
      })
      setFName(''); setFUnit(''); setFQty('0'); setFThreshold(''); setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleMovement(e: React.FormEvent) {
    e.preventDefault()
    if (!movementItem) return
    setSaving(true); setError(null); setSuccessMsg(null)
    try {
      const result = await api.stock.addMovement(movementItem.id, {
        type: mType,
        quantity: Number(mQty),
        date: mDate,
        reason: mReason || undefined,
      })
      if (result.alert) setSuccessMsg(`Stock bajo en ${movementItem.name}: ${result.item.currentQuantity} ${movementItem.unit}`)
      setMQty(''); setMReason(''); setMovementItem(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      await api.reports.download({ format: 'excel', modules: 'stock' })
    } catch {} finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-ink font-bold text-2xl">Stock</h1>
          {alerts.size > 0 && (
            <span className="bg-danger-light text-danger text-xs px-2.5 py-1 rounded-lg font-medium">
              {alerts.size} alerta{alerts.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="bg-card hover:bg-rim-subtle disabled:opacity-50 text-muted hover:text-ink border border-rim text-sm px-3 py-2 rounded-xl transition-colors"
          >
            {exporting ? '...' : '↓ Excel'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand-hover text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"
          >
            + Nuevo item
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-accent-light border border-accent/30 rounded-xl px-4 py-3 text-accent text-sm font-medium">
          ⚠️ {successMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-rim rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-ink">Nuevo ítem de stock</h2>
          <select value={fFieldId} onChange={e => setFFieldId(e.target.value)} required className={inputClass}>
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Nombre *" required className={inputClass} />
          <div className="grid grid-cols-2 gap-3">
            <select value={fCategory} onChange={e => setFCategory(e.target.value)} className={inputClass}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={fUnit} onChange={e => setFUnit(e.target.value)} placeholder="Unidad (ej: L, kg) *" required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted block mb-1">Cantidad inicial</label>
              <input value={fQty} onChange={e => setFQty(e.target.value)} type="number" min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Umbral de alerta</label>
              <input value={fThreshold} onChange={e => setFThreshold(e.target.value)} type="number" min="0" step="0.01" placeholder="Opcional" className={inputClass} />
            </div>
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

      {movementItem && (
        <form onSubmit={handleMovement} className="bg-card border border-accent/30 rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-ink">Movimiento: <span className="text-muted font-normal">{movementItem.name}</span></h2>
          <p className="text-xs text-muted">Stock actual: <span className="text-ink font-semibold">{movementItem.currentQuantity} {movementItem.unit}</span></p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setMType('in')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mType === 'in' ? 'bg-brand text-white' : 'bg-rim-subtle text-muted'}`}
            >
              Entrada
            </button>
            <button type="button" onClick={() => setMType('out')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${mType === 'out' ? 'bg-danger text-white' : 'bg-rim-subtle text-muted'}`}
            >
              Salida
            </button>
          </div>
          <input value={mQty} onChange={e => setMQty(e.target.value)} type="number" min="0.01" step="0.01"
            placeholder={`Cantidad (${movementItem.unit}) *`} required className={inputClass}
          />
          <input value={mDate} onChange={e => setMDate(e.target.value)} type="date" required className={inputClass} />
          <input value={mReason} onChange={e => setMReason(e.target.value)} placeholder="Motivo (opcional)" className={inputClass} />
          {error && <p className="text-danger text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              {saving ? 'Registrando...' : 'Registrar'}
            </button>
            <button type="button" onClick={() => { setMovementItem(null); setError(null) }}
              className="text-muted hover:text-ink text-sm px-4 py-2.5"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-subtle text-center mt-12">No hay items de stock.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id}
              className={`bg-card border rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${alerts.has(item.id) ? 'border-danger/30' : 'border-rim'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{item.name}</p>
                    {alerts.has(item.id) && (
                      <span className="text-xs bg-danger-light text-danger px-2 py-0.5 rounded-lg font-medium">Stock bajo</span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-0.5">{CATEGORIES[item.category]} · {item.unit}</p>
                  <p className="text-sm mt-1">
                    <span className="text-ink font-semibold">{item.currentQuantity}</span>
                    <span className="text-muted"> {item.unit}</span>
                    {item.alertThreshold && (
                      <span className="text-subtle text-xs ml-2">umbral: {item.alertThreshold}</span>
                    )}
                  </p>
                </div>
                <button onClick={() => { setMovementItem(item); setError(null); setSuccessMsg(null) }}
                  className="shrink-0 text-xs bg-rim-subtle hover:bg-rim text-muted hover:text-ink px-3 py-1.5 rounded-lg transition-colors"
                >
                  Movimiento
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
