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
      ? 'flex w-full items-center gap-3 rounded-lg py-2.5 pl-9 pr-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
      : 'flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'

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
