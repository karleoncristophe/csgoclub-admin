import { lazy, Suspense, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { runSessionBootstrap } from '@/auth/sessionBootstrap'
import type { AppDispatch, RootState } from '@/redux/store/store'
import DashboardLayout from '@/layouts/DashboardLayout'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'

const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)

const DashboardHomePage = lazy(
  () => import('@/pages/dashboard/DashboardHomePage'),
)
const SkinsPage = lazy(
  () => import('@/pages/dashboard/SkinsPage'),
)
const SkinDetailPage = lazy(
  () => import('@/pages/dashboard/SkinDetailPage'),
)
const WeaponCategoriesPage = lazy(
  () => import('@/pages/dashboard/WeaponCategoriesPage'),
)
const UsersPage = lazy(
  () => import('@/pages/dashboard/UsersPage'),
)
const UserDetailPage = lazy(
  () => import('@/pages/dashboard/UserDetailPage'),
)
const CasesPage = lazy(
  () => import('@/pages/dashboard/CasesPage'),
)
const CaseEditorPage = lazy(
  () => import('@/pages/dashboard/CaseEditorPage'),
)

function AuthPageFallback() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-zinc-950">
      <span className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <ThemeText as="p" tone="secondary" className="text-sm">
        Carregando...
      </ThemeText>
    </div>
  )
}

function PublicRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<AuthPageFallback />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHomePage />} />
        <Route path="skins" element={<SkinsPage />} />
        <Route path="skins/item" element={<SkinDetailPage />} />
        <Route path="categorias" element={<WeaponCategoriesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/new" element={<CaseEditorPage />} />
        <Route path="cases/:id" element={<CaseEditorPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function RoutesSwitch() {
  const accessToken = useSelector((s: RootState) => s.security.accessToken)
  const isAuthenticated = Boolean(accessToken?.trim())
  return isAuthenticated ? <ProtectedRoutes /> : <PublicRoutes />
}

export default function AppRoutes() {
  const dispatch = useDispatch<AppDispatch>()
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    runSessionBootstrap(dispatch).finally(() => {
      if (!cancelled) setSessionReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [dispatch])

  return (
    <BrowserRouter>
      {!sessionReady ? (
        <Surface variant="sessionLoader">
          <span
            className="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
            aria-hidden
          />
          <ThemeText as="p" tone="secondary" className="text-sm">
            Carregando sessão...
          </ThemeText>
        </Surface>
      ) : (
        <RoutesSwitch />
      )}
    </BrowserRouter>
  )
}
