import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'

type ThemeToggleProps = {
  /** Estilo compacto para a barra lateral */
  variant?: 'default' | 'sidebar'
}

export function ThemeToggle({ variant = 'default' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const base =
    variant === 'sidebar'
      ? 'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-default hover:text-foreground'
      : 'flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted shadow-sm transition hover:bg-default hover:text-foreground'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={base}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro' : 'Tema escuro'}
    >
      {variant === 'sidebar' ? (
        <>
          {isDark ? (
            <Sun className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          ) : (
            <Moon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          )}
          {isDark ? 'Tema claro' : 'Tema escuro'}
        </>
      ) : isDark ? (
        <Sun className="h-5 w-5" strokeWidth={2} aria-hidden />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={2} aria-hidden />
      )}
    </button>
  )
}
