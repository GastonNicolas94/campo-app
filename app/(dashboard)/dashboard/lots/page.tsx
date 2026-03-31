'use client'
import { useEffect, useState } from 'react'
import { api, type Lot } from '@/lib/api'
import Link from 'next/link'

export default function LotsPage() {
  const [lots, setLots] = useState<(Lot & { fieldName: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const fields = await api.fields.list()
        const allLots = await Promise.all(
          fields.map(async (f) => {
            const ls = await api.fields.lots(f.id)
            return ls.map(l => ({ ...l, fieldName: f.name }))
          })
        )
        setLots(allLots.flat())
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-6">
      <h1 className="font-display text-ink font-bold text-2xl">Lotes</h1>
      {lots.length === 0 ? (
        <p className="text-muted text-center mt-12">No hay lotes. Creá un establecimiento primero.</p>
      ) : (
        <ul className="space-y-2">
          {lots.map(lot => (
            <li key={lot.id}>
              <Link href={`/dashboard/lots/${lot.id}`}
                className="block bg-card border border-rim hover:border-brand/30 hover:shadow-[0_4px_16px_rgba(14,98,81,0.08)] rounded-2xl p-4 transition-all"
              >
                <p className="font-semibold text-ink">{lot.name}</p>
                <p className="text-sm text-muted mt-0.5">{lot.fieldName}</p>
                {lot.hectares && <p className="text-sm text-subtle mt-0.5">{lot.hectares} ha</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
