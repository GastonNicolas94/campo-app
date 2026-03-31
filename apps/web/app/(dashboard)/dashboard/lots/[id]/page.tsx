'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api, type Lot, type Campaign } from '@/lib/api'

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

  async function handleExport() {
    setExporting(true)
    try {
      await api.reports.download({ format: 'excel', modules: 'campaigns', lotId: id })
    } catch {} finally {
      setExporting(false)
    }
  }

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>
  if (!lot) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-300 text-sm">←</button>
        <div>
          <h1 className="text-xl font-semibold">{lot.name}</h1>
          {lot.hectares && <p className="text-sm text-zinc-400">{lot.hectares} ha</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-medium text-zinc-300">Campañas ({campaigns.length})</h2>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg"
          >
            {exporting ? '...' : '↓ Excel'}
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-3 py-1.5 rounded-lg"
          >
            + Campaña
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreateCampaign} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <input value={crop} onChange={e => setCrop(e.target.value)}
            placeholder="Cultivo (ej: Soja, Maíz) *" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <input value={variety} onChange={e => setVariety(e.target.value)}
            placeholder="Variedad (opcional)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <div>
            <label className="text-xs text-zinc-400 block mb-1">Fecha de siembra *</label>
            <input value={sowingDate} onChange={e => setSowingDate(e.target.value)}
              type="date" required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
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

      {campaigns.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center mt-8">No hay campañas. Creá una.</p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map(c => (
            <li key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">{c.crop}{c.variety ? ` — ${c.variety}` : ''}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {c.status === 'active' ? 'Activa' : 'Cerrada'}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">Siembra: {c.sowingDate}</p>
              {c.harvestDate && <p className="text-sm text-zinc-400">Cosecha: {c.harvestDate}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
