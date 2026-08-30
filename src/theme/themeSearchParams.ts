import {
  FONT_OPTIONS,
  type FontId,
  type RadiusScale,
  type Theme,
  type ThemeAppearance,
} from './themeConfig'

const RADIUS: RadiusScale[] = ['none', 'sm', 'md', 'lg', 'xl']
const FONTS = FONT_OPTIONS.map((item) => item.id)

function isRadius(value: string | null): value is RadiusScale {
  return Boolean(value && RADIUS.includes(value as RadiusScale))
}

function isFont(value: string | null): value is FontId {
  return Boolean(value && FONTS.includes(value as FontId))
}

function num(value: string | null, fallback: number, min: number, max: number) {
  if (value == null || value === '') return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

export function hasThemeShareParams(params: URLSearchParams) {
  return (
    params.has('hue') ||
    params.has('lightness') ||
    params.has('chroma') ||
    params.has('base') ||
    params.has('radius') ||
    params.has('formRadius') ||
    params.has('fontFamily')
  )
}

export function parseThemeShareParams(
  params: URLSearchParams,
  fallback: ThemeAppearance,
): { appearance: ThemeAppearance; theme?: Theme; vibrant?: boolean } {
  const radiusParam = params.get('radius')
  const formRadiusParam = params.get('formRadius')
  const fontParam = params.get('fontFamily')

  const appearance: ThemeAppearance = {
    ...fallback,
    accentLightness: num(params.get('lightness'), fallback.accentLightness, 0.2, 0.95),
    accentChroma: num(params.get('chroma'), fallback.accentChroma, 0, 0.35),
    accentHue: num(params.get('hue'), fallback.accentHue, 0, 360),
    baseChroma: num(params.get('base'), fallback.baseChroma, 0, 0.05),
    radius: isRadius(radiusParam) ? radiusParam : fallback.radius,
    fieldRadius: isRadius(formRadiusParam) ? formRadiusParam : fallback.fieldRadius,
    fontId: isFont(fontParam) ? fontParam : fallback.fontId,
    preset: 'custom',
  }

  const themeParam = params.get('theme')
  const theme: Theme | undefined =
    themeParam === 'dark' || themeParam === 'light' ? themeParam : undefined
  const vibrantParam = params.get('vibrant')
  const vibrant =
    vibrantParam == null ? undefined : vibrantParam === 'true' || vibrantParam === '1'

  return { appearance, theme, vibrant }
}

export function themeShareSearchParams(
  appearance: ThemeAppearance,
  theme: Theme,
  vibrant: boolean,
) {
  const params = new URLSearchParams()
  params.set('lightness', appearance.accentLightness.toFixed(4))
  params.set('chroma', appearance.accentChroma.toFixed(4))
  params.set('hue', appearance.accentHue.toFixed(4))
  params.set('base', appearance.baseChroma.toFixed(4))
  params.set('radius', appearance.radius)
  params.set('formRadius', appearance.fieldRadius)
  params.set('fontFamily', appearance.fontId)
  params.set('theme', theme)
  if (vibrant) params.set('vibrant', 'true')
  return params
}

export function themeShareUrl(
  appearance: ThemeAppearance,
  theme: Theme,
  vibrant: boolean,
  origin = typeof window === 'undefined' ? '' : window.location.origin,
) {
  const params = themeShareSearchParams(appearance, theme, vibrant)
  return `${origin}/dashboard/theme?${params.toString()}`
}
