'use client'
import { useEffect, useState } from 'react'
import { api, type Field } from '@/lib/api'
import Link from 'next/link'

const inputClass = "w-full bg-surface border border-rim rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-brand transition-colors"

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

  if (loading) return <p className="text-muted text-center mt-16">Cargando...</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-ink font-bold text-2xl">Establecimientos</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-brand hover:bg-brand-hover text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"
        >
          + Nuevo
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-card border border-rim rounded-2xl p-5 space-y-3 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <h2 className="text-sm font-semibold text-ink">Nuevo establecimiento</h2>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Nombre *" required className={inputClass}
          />
          <input value={location} onChange={e => setLocation(e.target.value)}
            placeholder="Ubicación (opcional)" className={inputClass}
          />
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

      {fields.length === 0 ? (
        <p className="text-muted text-center mt-12">No hay establecimientos. Creá uno.</p>
      ) : (
        <ul className="space-y-2">
          {fields.map(f => (
            <li key={f.id}>
              <Link href={`/dashboard/fields/${f.id}`}
                className="block bg-card border border-rim hover:border-brand/30 hover:shadow-[0_4px_16px_rgba(14,98,81,0.08)] rounded-2xl p-4 transition-all"
              >
                <p className="font-semibold text-ink">{f.name}</p>
                {f.location && <p className="text-sm text-muted mt-0.5">{f.location}</p>}
                {f.totalHectares && <p className="text-sm text-subtle mt-0.5">{f.totalHectares} ha</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
