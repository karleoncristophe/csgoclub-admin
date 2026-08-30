import {
  applyThemeTokens,
  generateHeroThemeTokens,
} from './generateHeroTheme'
import {
  DEFAULT_APPEARANCE,
  RADIUS_SCALE,
  appearanceFromPreset,
  ensureFontLoaded,
  fontOption,
  type ColorTheme,
  type Theme,
  type ThemeAppearance,
} from './themeConfig'
import { hasThemeShareParams, parseThemeShareParams } from './themeSearchParams'

const APPEARANCE_KEY = 'cs2club-admin-theme-appearance'
export const VIBRANT_PALETTE_STORAGE_KEY = 'cs2club-admin-vibrant-palette'
const LEGACY_COLOR_KEY = 'cs2club-admin-color-theme'
const NAMED_PRESETS: Exclude<ColorTheme, 'custom'>[] = [
  'default',
  'sky',
  'lavender',
  'mint',
  'ember',
  'spotify',
  'discord',
]

function isRadius(value: unknown): value is ThemeAppearance['radius'] {
  return value === 'none' || value === 'sm' || value === 'md' || value === 'lg' || value === 'xl'
}

export function readAppearance(): ThemeAppearance {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE
  try {
    const share = new URLSearchParams(window.location.search)
    if (window.location.pathname.includes('/dashboard/theme') && hasThemeShareParams(share)) {
      return parseThemeShareParams(share, DEFAULT_APPEARANCE).appearance
    }
    const raw = localStorage.getItem(APPEARANCE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ThemeAppearance>
      return {
        ...DEFAULT_APPEARANCE,
        ...parsed,
        radius: isRadius(parsed.radius) ? parsed.radius : DEFAULT_APPEARANCE.radius,
        fieldRadius: isRadius(parsed.fieldRadius)
          ? parsed.fieldRadius
          : DEFAULT_APPEARANCE.fieldRadius,
      }
    }
    const legacy = localStorage.getItem(LEGACY_COLOR_KEY)
    if (legacy && NAMED_PRESETS.includes(legacy as Exclude<ColorTheme, 'custom'>)) {
      return appearanceFromPreset(legacy as Exclude<ColorTheme, 'custom'>)
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_APPEARANCE
}

export function persistAppearance(appearance: ThemeAppearance) {
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance))
  } catch {
    /* ignore */
  }
}

export function readVibrantPalette(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const share = new URLSearchParams(window.location.search)
    if (window.location.pathname.includes('/dashboard/theme') && hasThemeShareParams(share)) {
      const vibrant = parseThemeShareParams(share, DEFAULT_APPEARANCE).vibrant
      if (vibrant != null) return vibrant
    }
    return localStorage.getItem(VIBRANT_PALETTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function applyAppearance(
  mode: Theme,
  appearance: ThemeAppearance,
  vibrant = false,
) {
  const font = fontOption(appearance.fontId)
  ensureFontLoaded(appearance.fontId)
  applyThemeTokens(
    generateHeroThemeTokens(mode, {
      accentLightness: appearance.accentLightness,
      accentChroma: appearance.accentChroma,
      accentHue: appearance.accentHue,
      baseChroma: appearance.baseChroma,
      radiusRem: RADIUS_SCALE[appearance.radius].rem,
      fieldRadiusRem: RADIUS_SCALE[appearance.fieldRadius].rem,
      fontFamily: font.family,
      vibrant,
    }),
  )
}

export function bootTheme(mode?: Theme) {
  if (typeof document === 'undefined') return
  const share = new URLSearchParams(window.location.search)
  const fromShare =
    window.location.pathname.includes('/dashboard/theme') && hasThemeShareParams(share)
      ? parseThemeShareParams(share, DEFAULT_APPEARANCE)
      : null
  if (fromShare?.theme) {
    document.documentElement.classList.toggle('dark', fromShare.theme === 'dark')
    document.documentElement.classList.toggle('light', fromShare.theme === 'light')
  }
  const dark = document.documentElement.classList.contains('dark')
  applyAppearance(
    mode ?? fromShare?.theme ?? (dark ? 'dark' : 'light'),
    fromShare?.appearance ?? readAppearance(),
    fromShare?.vibrant ?? readVibrantPalette(),
  )
}
