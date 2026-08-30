import { Typography } from '@heroui/react'
import type { ElementType, ReactNode } from 'react'

const tones = {
  /** Títulos e texto principal */
  primary: 'text-foreground',
  /** Parágrafos secundários na página */
  secondary: 'text-muted',
  /** Legendas e auxiliares */
  muted: 'text-muted',
  /** Menos ênfase (rodapé, meta) */
  faint: 'text-muted/75',
  /** Labels de seção (sidebar, formulário) */
  label: 'text-muted',
  /** Título de seção em caixa alta */
  overline:
    'text-xs font-semibold uppercase tracking-wider text-muted/75',
  /** Link / item ativo da marca */
  brand: 'text-accent',
  /** Aviso */
  warning: 'text-warning',
  /** Erro inline */
  danger: 'text-danger',
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
  const classes = `${tones[tone]} ${className}`.trim()
  const typographyColor = ['secondary', 'muted', 'faint', 'label', 'overline'].includes(tone)
    ? 'muted'
    : 'default'

  if (typeof Comp === 'string' && /^h[1-6]$/.test(Comp)) {
    const level = Number(Comp.slice(1)) as 1 | 2 | 3 | 4 | 5 | 6

    return (
      <Typography.Heading
        level={level}
        color={typographyColor}
        className={classes}
        {...rest}
      >
        {children}
      </Typography.Heading>
    )
  }

  if (Comp === 'p') {
    return (
      <Typography.Paragraph
        color={typographyColor}
        className={classes}
        {...rest}
      >
        {children}
      </Typography.Paragraph>
    )
  }

  return (
    <Comp className={classes} {...rest}>
      {children}
    </Comp>
  )
}
