'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LayoutDashboard, MapPin, Layers, Sprout, ListChecks, Package, LogOut, Menu, X, Users } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/dashboard/fields', label: 'Establecimientos', icon: MapPin },
  { href: '/dashboard/lots', label: 'Lotes', icon: Layers },
  { href: '/dashboard/campaigns', label: 'Campañas', icon: Sprout },
  { href: '/dashboard/activities', label: 'Actividades', icon: ListChecks },
  { href: '/dashboard/stock', label: 'Stock', icon: Package },
  { href: '/dashboard/team', label: 'Equipo', icon: Users, ownerOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) router.replace('/login')

    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        setUserRole(user.role)
      }
    } catch {
      // silently fail
    }
  }, [router])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    router.replace('/login')
  }

  function isActive(href: string) {
    return href === '/dashboard'
      ? pathname === href
      : pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-surface text-ink flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-card border-r border-rim sticky top-0 h-screen p-5 gap-0.5">
        <div className="mb-8 px-2">
          <span className="font-display text-brand font-bold text-xl tracking-tight">Campo App</span>
          <p className="text-xs text-muted mt-0.5">Gestión agrícola</p>
        </div>

        {navItems.map(item => {
          // Mostrar el item solo si no es solo para owner, o si el usuario es owner
          if ('ownerOnly' in item && item.ownerOnly && userRole !== 'owner') {
            return null
          }
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                active
                  ? 'bg-brand text-white font-medium'
                  : 'text-muted hover:text-ink hover:bg-rim-subtle'
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
              {item.label}
            </Link>
          )
        })}

        <div className="mt-auto">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted hover:text-ink hover:bg-rim-subtle transition-colors"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="md:hidden bg-card border-b border-rim px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <span className="font-display text-brand font-bold text-lg tracking-tight">Campo App</span>
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-rim-subtle transition-colors"
            aria-label="Menú"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        {/* Dropdown menu mobile */}
        {menuOpen && (
          <div className="md:hidden bg-card border-b border-rim flex flex-col shadow-sm">
            {navItems.map(item => {
              // Mostrar el item solo si no es solo para owner, o si el usuario es owner
              if ('ownerOnly' in item && item.ownerOnly && userRole !== 'owner') {
                return null
              }
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3.5 text-sm border-b border-rim-subtle transition-colors ${
                    active ? 'text-brand font-medium bg-brand-light' : 'text-muted'
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
                  {item.label}
                </Link>
              )
            })}
            <button
              onClick={logout}
              className="flex items-center gap-3 px-5 py-3.5 text-sm text-muted text-left"
            >
              <LogOut size={16} strokeWidth={1.75} />
              Cerrar sesión
            </button>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
