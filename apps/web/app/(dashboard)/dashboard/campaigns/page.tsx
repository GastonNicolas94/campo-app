'use client'
import { useEffect, useState } from 'react'
import { api, type Campaign } from '@/lib/api'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<(Campaign & { lotName: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const fields = await api.fields.list()
        const allLots = await Promise.all(fields.map(f => api.fields.lots(f.id)))
        const lots = allLots.flat()
        const allCampaigns = await Promise.all(
          lots.map(async (l) => {
            const cs = await api.lots.campaigns(l.id)
            return cs.map(c => ({ ...c, lotName: l.name }))
          })
        )
        setCampaigns(allCampaigns.flat())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Campañas</h1>
      {campaigns.length === 0 ? (
        <p className="text-zinc-400 text-center mt-12">No hay campañas. Creá un lote primero.</p>
      ) : (
        <ul className="space-y-2">
          {campaigns.map(c => (
            <li key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.crop}{c.variety ? ` — ${c.variety}` : ''}</p>
                  <p className="text-sm text-zinc-400 mt-0.5">{c.lotName}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">Siembra: {c.sowingDate}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
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
