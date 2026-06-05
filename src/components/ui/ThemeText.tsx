import type { ElementType, ReactNode } from 'react'

const tones = {
  /** Títulos e texto principal */
  primary: 'text-zinc-900 dark:text-zinc-100',
  /** Parágrafos secundários na página */
  secondary: 'text-zinc-600 dark:text-zinc-400',
  /** Legendas e auxiliares */
  muted: 'text-zinc-500 dark:text-zinc-500',
  /** Menos ênfase (rodapé, meta) */
  faint: 'text-zinc-400 dark:text-zinc-500',
  /** Labels de seção (sidebar, formulário) */
  label: 'text-slate-600 dark:text-zinc-400',
  /** Título de seção em caixa alta */
  overline:
    'text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500',
  /** Link / item ativo da marca */
  brand: 'text-brand-700 dark:text-brand-400',
  /** Aviso */
  warning: 'text-amber-700 dark:text-amber-400',
  /** Erro inline */
  danger: 'text-red-600 dark:text-red-400',
} as const

export type ThemeTextTone = keyof typeof tones

type ThemeTextProps = {
  as?: ElementType
  tone?: ThemeTextTone
  className?: string
  children?: ReactNode
} & Record<string, unknown>

export function ThemeText({
  as: Comp = 'p',
  tone = 'primary',
  className = '',
  children,
  ...rest
}: ThemeTextProps) {
  return (
    <Comp className={`${tones[tone]} ${className}`.trim()} {...rest}>
      {children}
    </Comp>
  )
}
