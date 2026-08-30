import { Palette } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '@/theme/ThemeContext'
import { accentCss } from '@/theme/themeConfig'

type ColorThemePickerProps = { variant?: 'default' | 'sidebar' }

export function ColorThemePicker({ variant = 'default' }: ColorThemePickerProps) {
  const { appearance } = useTheme()
  const compact = variant === 'default'
  const { pathname } = useLocation()
  const active = pathname.startsWith('/dashboard/settings')

  return (
    <div className="relative">
      <Link
        to="/dashboard/settings"
        className={
          compact
            ? 'flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-muted shadow-sm transition hover:bg-default hover:text-foreground'
            : `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-accent-soft text-accent-soft-foreground'
                  : 'text-muted hover:bg-default hover:text-foreground'
              }`
        }
        aria-current={active ? 'page' : undefined}
      >
        <span
          className="h-5 w-5 rounded-full ring-2 ring-white shadow-sm outline-1 outline-black/10"
          style={{ background: accentCss(appearance) }}
          aria-hidden
        />
        {compact ? <span className="sr-only">Editar aparência</span> : <span>Aparência</span>}
        {!compact ? <Palette className="ml-auto h-4 w-4" aria-hidden /> : null}
      </Link>
    </div>
  )
}
