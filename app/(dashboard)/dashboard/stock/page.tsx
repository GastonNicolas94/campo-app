'use client'
import { useEffect, useState } from 'react'
import { api, type StockItem, type Field } from '@/lib/api'

const CATEGORIES: Record<string, string> = {
  agroquimico: 'Agroquímico', semilla: 'Semilla', combustible: 'Combustible',
  fertilizante: 'Fertilizante', repuesto: 'Repuesto', otro: 'Otro',
}

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [fields, setFields] = useState<Field[]>([])
  const [alerts, setAlerts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [movementItem, setMovementItem] = useState<StockItem | null>(null)

  // form crear item
  const [fName, setFName] = useState('')
  const [fCategory, setFCategory] = useState('agroquimico')
  const [fUnit, setFUnit] = useState('')
  const [fQty, setFQty] = useState('0')
  const [fThreshold, setFThreshold] = useState('')
  const [fFieldId, setFFieldId] = useState('')

  // form movimiento
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
      if (result.alert) setSuccessMsg(`⚠️ Stock bajo en ${movementItem.name}: ${result.item.currentQuantity} ${movementItem.unit}`)
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

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Stock</h1>
          {alerts.size > 0 && (
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
              {alerts.size} alerta{alerts.size > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg"
          >
            {exporting ? '...' : '↓ Excel'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            + Nuevo item
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-yellow-400 text-sm">
          {successMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium">Nuevo ítem de stock</h2>
          <select value={fFieldId} onChange={e => setFFieldId(e.target.value)} required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
          <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Nombre *" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <select value={fCategory} onChange={e => setFCategory(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={fUnit} onChange={e => setFUnit(e.target.value)} placeholder="Unidad (ej: L, kg) *" required
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Cantidad inicial</label>
              <input value={fQty} onChange={e => setFQty(e.target.value)} type="number" min="0" step="0.01"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 block mb-1">Umbral de alerta</label>
              <input value={fThreshold} onChange={e => setFThreshold(e.target.value)} type="number" min="0" step="0.01" placeholder="Opcional"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
              />
            </div>
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

      {/* Formulario movimiento */}
      {movementItem && (
        <form onSubmit={handleMovement} className="bg-zinc-900 border border-yellow-500/30 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-medium">Movimiento: <span className="text-zinc-300">{movementItem.name}</span></h2>
          <p className="text-xs text-zinc-400">Stock actual: <span className="text-white">{movementItem.currentQuantity} {movementItem.unit}</span></p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setMType('in')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mType === 'in' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
            >
              Entrada
            </button>
            <button type="button" onClick={() => setMType('out')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mType === 'out' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
            >
              Salida
            </button>
          </div>
          <input value={mQty} onChange={e => setMQty(e.target.value)} type="number" min="0.01" step="0.01" placeholder={`Cantidad (${movementItem.unit}) *`} required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <input value={mDate} onChange={e => setMDate(e.target.value)} type="date" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
          <input value={mReason} onChange={e => setMReason(e.target.value)} placeholder="Motivo (opcional)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg"
            >
              {saving ? 'Registrando...' : 'Registrar'}
            </button>
            <button type="button" onClick={() => { setMovementItem(null); setError(null) }}
              className="text-zinc-400 hover:text-zinc-200 text-sm px-4 py-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-zinc-500 text-center mt-12">No hay items de stock.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className={`bg-zinc-900 border rounded-xl p-4 ${alerts.has(item.id) ? 'border-red-500/40' : 'border-zinc-800'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.name}</p>
                    {alerts.has(item.id) && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Stock bajo</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-0.5">{CATEGORIES[item.category]} · {item.unit}</p>
                  <p className="text-sm mt-1">
                    <span className="text-white font-medium">{item.currentQuantity}</span>
                    <span className="text-zinc-500"> {item.unit}</span>
                    {item.alertThreshold && (
                      <span className="text-zinc-500 text-xs ml-2">umbral: {item.alertThreshold}</span>
                    )}
                  </p>
                </div>
                <button onClick={() => { setMovementItem(item); setError(null); setSuccessMsg(null) }}
                  className="shrink-0 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors"
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
