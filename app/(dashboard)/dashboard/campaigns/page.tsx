'use client'
import { useEffect, useState } from 'react'
import { api, type Campaign } from '@/lib/api'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<(Campaign & { lotName: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const fieldsResult = await api.fields.list()
        const allLots = await Promise.all(fieldsResult.data.map(f => api.fields.lots(f.id)))
        const lots = allLots.flatMap(r => r.data)
        const allCampaigns = await Promise.all(
          lots.map(async (l) => {
            const result = await api.lots.campaigns(l.id)
            return result.data.map(c => ({ ...c, lotName: l.name }))
          })
        )
        setCampaigns(allCampaigns.flat())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-6">
      <h1 className="font-display text-ink font-bold text-2xl">Campañas</h1>
      {campaigns.length === 0 ? (
        <p className="text-muted text-center mt-12">No hay campañas. Creá un lote primero.</p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map(c => (
            <li key={c.id} className="bg-card border border-rim rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink">{c.crop}{c.variety ? ` — ${c.variety}` : ''}</p>
                  <p className="text-sm text-muted mt-0.5">{c.lotName}</p>
                  <p className="text-sm text-subtle mt-0.5">Siembra: {c.sowingDate}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                  c.status === 'active'
                    ? 'bg-brand-light text-brand'
                    : 'bg-rim-subtle text-muted'
                }`}>
                  {c.status === 'active' ? 'Activa' : 'Cerrada'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
