'use client'
import { useEffect, useState } from 'react'
import { api, type Field } from '@/lib/api'
import Link from 'next/link'

export default function FieldsPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    try {
      setFields(await api.fields.list())
    } catch {
      setError('No se pudieron cargar los establecimientos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await api.fields.create({ name, location: location || undefined })
      setName(''); setLocation(''); setShowForm(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-zinc-400 text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Establecimientos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Nombre *" required
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Ubicación (opcional)"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          />
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

      {fields.length === 0 ? (
        <p className="text-zinc-400 text-center mt-12">No hay establecimientos. Creá uno.</p>
      ) : (
        <ul className="space-y-3">
          {fields.map(f => (
            <li key={f.id}>
              <Link href={`/dashboard/fields/${f.id}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors"
              >
                <p className="font-medium">{f.name}</p>
                {f.location && <p className="text-sm text-zinc-400 mt-0.5">{f.location}</p>}
                {f.totalHectares && <p className="text-sm text-zinc-500 mt-0.5">{f.totalHectares} ha</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
