'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ tenantName: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function setField(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { accessToken, refreshToken } = await api.auth.register(form)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-surface border border-rim rounded-xl px-3 py-2.5 text-sm text-ink placeholder:text-subtle focus:outline-none focus:border-brand transition-colors"

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <span className="font-display text-brand font-bold text-2xl tracking-tight">Campo App</span>
        <p className="text-muted text-sm mt-1">Gestión agrícola</p>
      </div>
      <div className="bg-card border border-rim rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
        <h1 className="font-display text-ink font-bold text-xl mb-6">Crear cuenta</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="tenantName" className="text-sm font-medium text-ink">Nombre del establecimiento</label>
            <input
              id="tenantName"
              value={form.tenantName}
              onChange={(e) => setField('tenantName', e.target.value)}
              placeholder="Estancia Los Robles"
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="tu@email.com"
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-ink">Contraseña</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-ink">Teléfono (opcional)</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="+54911..."
              className={inputClass}
            />
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-medium text-sm py-3 rounded-xl transition-colors"
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
          <p className="text-center text-sm text-muted">
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-brand font-medium hover:underline">
              Ingresá
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
