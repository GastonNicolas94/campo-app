'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, type Lot, type Campaign } from '@/lib/api'

const inputClass = "w-full bg-surface border border-rim rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-brand transition-colors"

export default function LotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lot, setLot] = useState<Lot | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [crop, setCrop] = useState('')
  const [variety, setVariety] = useState('')
  const [sowingDate, setSowingDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [closeYield, setCloseYield] = useState('')
  const [closeUnit, setCloseUnit] = useState<'qq_ha' | 'tn_ha'>('qq_ha')
  const [closeNotes, setCloseNotes] = useState('')
  const [closeSaving, setCloseSaving] = useState(false)
  const [closeError, setCloseError] = useState<string | null>(null)

  async function load() {
    try {
      const [l, cs] = await Promise.all([api.lots.getById(id), api.lots.campaigns(id)])
      setLot(l); setCampaigns(cs)
    } catch {
      router.back()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.lots.createCampaign(id, { crop, variety: variety || undefined, sowingDate })
      setCrop(''); setVariety(''); setSowingDate(''); setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseCampaign(e: React.FormEvent) {
    e.preventDefault()
    if (!closingId) return
    setCloseSaving(true); setCloseError(null)
    try {
      await api.campaigns.closeWithResult(closingId, {
        yieldAmount: Number(closeYield),
        yieldUnit: closeUnit,
        notes: closeNotes || undefined,
      })
      setClosingId(null); setCloseYield(''); setCloseNotes('')
      await load()
    } catch (err) {
      setCloseError(err instanceof Error ? err.message : 'Error al cerrar campaña')
    } finally {
      setCloseSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      await api.reports.download({ format: 'excel', modules: 'campaigns', lotId: id })
    } catch {} finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>
  if (!lot) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-muted hover:text-ink text-sm transition-colors">←</button>
        <div>
          <h1 className="font-display text-ink font-bold text-2xl">{lot.name}</h1>
          {lot.hectares && <p className="text-sm text-muted mt-0.5">{lot.hectares} ha</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Campañas ({campaigns.length})</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="bg-card hover:bg-rim-subtle disabled:opacity-50 text-muted hover:text-ink border border-rim text-sm px-3 py-2 rounded-xl transition-colors"
          >
            {exporting ? '...' : '↓ Excel'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-brand hover:bg-brand-hover text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"
          >
            + Campaña
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateCampaign} className="bg-card border border-rim rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <input value={crop} onChange={e => setCrop(e.target.value)}
            placeholder="Cultivo (ej: Soja, Maíz) *" required className={inputClass}
          />
          <input value={variety} onChange={e => setVariety(e.target.value)}
            placeholder="Variedad (opcional)" className={inputClass}
          />
          <div>
            <label className="text-xs text-muted block mb-1">Fecha de siembra *</label>
            <input value={sowingDate} onChange={e => setSowingDate(e.target.value)}
              type="date" required className={inputClass}
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

      {campaigns.length === 0 ? (
        <p className="text-subtle text-sm text-center mt-8">No hay campañas. Creá una.</p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map(c => (
            <li key={c.id} className="bg-card border border-rim rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink">{c.crop}{c.variety ? ` — ${c.variety}` : ''}</p>
                <div className="flex items-center gap-2">
                  {c.status === 'active' && (
                    <button
                      onClick={() => { setClosingId(c.id); setCloseYield(''); setCloseNotes(''); setCloseError(null) }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-rim-subtle hover:bg-rim text-muted transition-colors"
                    >
                      Cerrar
                    </button>
                  )}
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                    c.status === 'active' ? 'bg-brand-light text-brand' : 'bg-rim-subtle text-muted'
                  }`}>
                    {c.status === 'active' ? 'Activa' : 'Cerrada'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted mt-1">Siembra: {c.sowingDate}</p>
              {c.harvestDate && <p className="text-sm text-muted">Cosecha: {c.harvestDate}</p>}
            </li>
          ))}
        </ul>
      )}

      {/* Modal cerrar campaña */}
      {closingId && (
        <div className="fixed inset-0 bg-ink/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCloseCampaign} className="bg-card border border-rim rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <h2 className="font-display text-ink font-bold text-lg">Cerrar campaña</h2>
            <div>
              <label className="text-xs text-muted block mb-1">Rendimiento *</label>
              <input
                type="number" step="0.01" min="0" required
                value={closeYield} onChange={e => setCloseYield(e.target.value)}
                placeholder="ej: 35"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Unidad *</label>
              <select
                value={closeUnit} onChange={e => setCloseUnit(e.target.value as 'qq_ha' | 'tn_ha')}
                className={inputClass}
              >
                <option value="qq_ha">qq/ha</option>
                <option value="tn_ha">tn/ha</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Notas (opcional)</label>
              <input
                value={closeNotes} onChange={e => setCloseNotes(e.target.value)}
                placeholder="Observaciones..."
                className={inputClass}
              />
            </div>
            {closeError && <p className="text-danger text-sm">{closeError}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={closeSaving}
                className="bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-sm px-4 py-2.5 rounded-xl flex-1 transition-colors"
              >
                {closeSaving ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
              <button type="button" onClick={() => setClosingId(null)}
                className="text-muted hover:text-ink text-sm px-4 py-2.5"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
