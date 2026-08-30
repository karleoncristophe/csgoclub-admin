import { formatOklch } from './oklch'

export type ThemeMode = 'light' | 'dark'

export type HeroThemeInput = {
  accentLightness: number
  accentChroma: number
  accentHue: number
  baseChroma: number
  radiusRem: number
  fieldRadiusRem: number
  fontFamily: string
  /** Saturated success / warning / danger. Off = accessible muted status. */
  vibrant?: boolean
}

/**
 * Source tokens matching HeroUI Theme Builder export.
 * Hover/soft/separator levels stay as color-mix() in @heroui/styles.
 * @see https://heroui.com/docs/react/getting-started/theming
 */
export function generateHeroThemeTokens(
  mode: ThemeMode,
  input: HeroThemeInput,
): Record<string, string> {
  const H = input.accentHue
  const Ca = Math.max(0, input.accentChroma)
  const Cb = Math.max(0, input.baseChroma)
  const LaRaw = Math.min(1, Math.max(0, input.accentLightness))
  const La = mode === 'dark' ? Math.max(LaRaw, 0.7) : LaRaw

  const snow = formatOklch(0.9911, 0, 0)
  const eclipse = formatOklch(0.2103, Math.min(0.02, Cb * 0.3057), H)
  const accent = formatOklch(La, Ca, H)
  const accentForeground =
    La >= 0.7 ? formatOklch(0.15, Ca * 0.1875, H) : snow

  const statusChroma = (chroma: number) =>
    input.vibrant ? chroma : chroma * 0.42

  const status =
    mode === 'dark'
      ? {
          '--danger': formatOklch(0.594, statusChroma(0.2043), 28.65),
          '--danger-foreground': snow,
          '--success': formatOklch(0.7329, statusChroma(0.201), 154.83),
          '--success-foreground': formatOklch(0.2103, 0.0059, 154.83),
          '--warning': formatOklch(0.8203, statusChroma(0.1442), 80.36),
          '--warning-foreground': formatOklch(0.2103, 0.0059, 80.36),
        }
      : {
          '--danger': formatOklch(0.6532, statusChroma(0.2418), 29.76),
          '--danger-foreground': snow,
          '--success': formatOklch(0.7329, statusChroma(0.201), 154.83),
          '--success-foreground': formatOklch(0.2103, 0.0059, 154.83),
          '--warning': formatOklch(0.7819, statusChroma(0.1646), 76.35),
          '--warning-foreground': formatOklch(0.2103, 0.0059, 76.35),
        }

  const colors =
    mode === 'dark'
      ? {
          '--background': formatOklch(0.12, Cb, H),
          '--foreground': formatOklch(0.9911, Cb, H),
          '--border': formatOklch(0.28, Cb, H),
          '--default': formatOklch(0.274, Cb, H),
          '--default-foreground': snow,
          '--field-background': formatOklch(0.2103, Cb * 2, H),
          '--field-foreground': formatOklch(0.9911, Cb, H),
          '--field-placeholder': formatOklch(0.705, Cb * 2, H),
          '--muted': formatOklch(0.705, Cb * 2, H),
          '--overlay': formatOklch(0.2103, Cb * 2, H),
          '--overlay-foreground': formatOklch(0.9911, Cb, H),
          '--scrollbar': formatOklch(0.705, Cb, H),
          '--segment': formatOklch(0.3964, Cb, H),
          '--segment-foreground': formatOklch(0.9911, Cb, H),
          '--separator': formatOklch(0.25, Cb, H),
          '--surface': formatOklch(0.2103, Cb * 2, H),
          '--surface-foreground': formatOklch(0.9911, Cb, H),
          '--surface-secondary': formatOklch(0.257, Cb * 1.5, H),
          '--surface-secondary-foreground': formatOklch(0.9911, Cb, H),
          '--surface-tertiary': formatOklch(0.2721, Cb * 1.5, H),
          '--surface-tertiary-foreground': formatOklch(0.9911, Cb, H),
        }
      : {
          '--background': formatOklch(0.9702, Cb, H),
          '--foreground': formatOklch(0.2103, Cb, H),
          '--border': formatOklch(0.9, Cb, H),
          '--default': formatOklch(0.94, Cb, H),
          '--default-foreground': eclipse,
          '--field-background': formatOklch(1, Cb * 0.5, H),
          '--field-foreground': formatOklch(0.2103, Cb, H),
          '--field-placeholder': formatOklch(0.5517, Cb * 2, H),
          '--muted': formatOklch(0.5517, Cb * 2, H),
          '--overlay': formatOklch(1, Cb * 0.3, H),
          '--overlay-foreground': formatOklch(0.2103, Cb, H),
          '--scrollbar': formatOklch(0.871, Cb, H),
          '--segment': formatOklch(1, Cb, H),
          '--segment-foreground': formatOklch(0.2103, Cb, H),
          '--separator': formatOklch(0.92, Cb, H),
          '--surface': formatOklch(1, Cb * 0.5, H),
          '--surface-foreground': formatOklch(0.2103, Cb, H),
          '--surface-secondary': formatOklch(0.9524, Cb * 0.8, H),
          '--surface-secondary-foreground': formatOklch(0.2103, Cb, H),
          '--surface-tertiary': formatOklch(0.9373, Cb * 0.8, H),
          '--surface-tertiary-foreground': formatOklch(0.2103, Cb, H),
        }

  return {
    '--accent': accent,
    '--accent-foreground': accentForeground,
    '--focus': accent,
    '--field-border': 'transparent',
    '--field-border-width': '0px',
    '--eclipse': eclipse,
    '--snow': snow,
    '--radius': `${input.radiusRem}rem`,
    '--field-radius': `${input.fieldRadiusRem}rem`,
    '--font-sans': input.fontFamily,
    ...colors,
    ...status,
  }
}

export function applyThemeTokens(tokens: Record<string, string>) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value)
  }
}
