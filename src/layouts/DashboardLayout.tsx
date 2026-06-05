import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { LucideIcon } from 'lucide-react'
import {
  Gem,
  LayoutDashboard,
  Layers,
  LogOut,
  Menu,
  Users,
} from 'lucide-react'
import { useGetMeQuery } from '@/redux/store/api/auth/api.auth'
import { signOut } from '@/redux/store/slices/securitySlice'
import { removeMe, setMe } from '@/redux/store/slices/meSlice'
import type { RootState } from '@/redux/store/store'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

type NavItem = { href: string; label: string; Icon: LucideIcon }
type NavSection = { title: string; items: readonly NavItem[] }

const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'Geral',
    items: [
      { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
      { href: '/dashboard/users', label: 'Usuários', Icon: Users },
      { href: '/dashboard/skins', label: 'Skins', Icon: Gem },
      { href: '/dashboard/categorias', label: 'Categorias', Icon: Layers },
    ],
  },
]

function navItemActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function initialsFromName(name?: string) {
  if (!name?.trim()) return '—'
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? ''
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : (parts[0]?.[1] ?? '')
  return (a + b).toUpperCase() || '—'
}

function roleLabel(role?: string) {
  if (!role) return 'Administrador'
  const r = role.toLowerCase()
  if (r.includes('super') || r.includes('platform')) return 'Admin da plataforma'
  if (r.includes('admin')) return 'Administrador'
  return role
}

function navLinkClass(active: boolean) {
  const base =
    'flex items-center gap-3 rounded-lg py-2.5 pl-9 pr-4 text-sm font-medium transition-colors'
  if (active) {
    return `${base} text-brand-700 dark:text-brand-400`
  }
  return `${base} text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`
}

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const accessToken = useSelector((s: RootState) => s.security.accessToken)
  const me = useSelector((s: RootState) => s.me)
  const { data: meData } = useGetMeQuery(undefined, { skip: !accessToken })

  useEffect(() => {
    if (!meData) return
    const id = String(meData._id)
    if (!me.role || me._id !== id) {
      dispatch(
        setMe({
          _id: id,
          name: meData.name,
          email: meData.email,
          role: meData.role,
        }),
      )
    }
  }, [meData, me.role, me._id, dispatch])

  const displayName = me.name?.trim() || 'Conta'
  const year = new Date().getFullYear()

  const handleSignOut = () => {
    dispatch(signOut())
    dispatch(removeMe())
    navigate('/')
    setDrawerOpen(false)
  }

  const sidebar = (
    <Surface variant="sidebarStack">
      <div className="scrollbar-edge flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex shrink-0 items-center gap-3 px-6 pt-6">
          <div className={surfaceClass('userAvatar')} aria-hidden>
            {initialsFromName(me.name)}
          </div>
          <div className="min-w-0 flex-1">
            <ThemeText as="p" tone="primary" className="truncate font-semibold">
              {displayName}
            </ThemeText>
            <ThemeText as="p" tone="label" className="truncate text-xs">
              {roleLabel(me.role)}
            </ThemeText>
            {me.email ? (
              <ThemeText as="p" tone="faint" className="mt-0.5 truncate text-[11px]">
                {me.email}
              </ThemeText>
            ) : null}
          </div>
        </div>

        <nav className="shrink-0 space-y-1 px-3 pb-6 pt-5">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.title} className={si > 0 ? 'mt-8' : ''}>
              <ThemeText as="p" tone="overline" className="mb-3 px-3">
                {section.title}
              </ThemeText>
              <div className="space-y-1">
                {section.items
                  .map(({ href, label, Icon }) => {
                  const active = navItemActive(location.pathname, href)
                  return (
                    <div key={href} className="relative">
                      {active ? (
                        <span
                          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-brand-600"
                          aria-hidden
                        />
                      ) : null}
                      <Link
                        to={href}
                        onClick={() => setDrawerOpen(false)}
                        className={navLinkClass(active)}
                      >
                        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
                        {label}
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-slate-100 px-3 pb-2 pt-4 dark:border-zinc-800">
          <ThemeToggle variant="sidebar" />
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg py-2.5 pl-9 pr-4 text-sm font-medium text-slate-500 transition-colors hover:bg-brand-50/80 hover:text-brand-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-brand-400"
          >
            <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
            Sair
          </button>
        </div>

        <div className="shrink-0 px-6 pb-6 pt-2">
          <ThemeText
            as="p"
            tone="faint"
            className="text-center text-[10px] leading-relaxed"
          >
            © {year} CS2Club · Painel admin
          </ThemeText>
        </div>
      </div>
    </Surface>
  )

  const asideClass = surfaceClass('sidebarAside')

  return (
    <Surface variant="page">
      {drawerOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className={surfaceClass('drawerOverlay')}
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 ${asideClass} transition-transform duration-200 ease-out lg:hidden ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebar}
      </aside>

      <div className="mx-auto flex min-h-dvh max-w-[1600px] flex-col lg:flex-row">
        <aside
          className={`hidden lg:sticky lg:top-0 lg:h-dvh ${asideClass} lg:flex`}
        >
          {sidebar}
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className={surfaceClass('mobileHeader')}>
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setDrawerOpen(true)}
              className={surfaceClass('menuIconButton')}
            >
              <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <ThemeText
                as="p"
                tone="primary"
                className="truncate text-sm font-semibold tracking-tight"
              >
                CS2Club
              </ThemeText>
              <ThemeText as="p" tone="label" className="truncate text-xs">
                Painel administrativo
              </ThemeText>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
            <Suspense
              fallback={
                <div className="flex min-h-[min(50vh,28rem)] flex-col items-center justify-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                  <ThemeText as="p" tone="secondary" className="text-sm">
                    Carregando página…
                  </ThemeText>
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </Surface>
  )
}
