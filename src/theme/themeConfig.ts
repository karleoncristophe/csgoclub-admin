import { hexToOklch } from './oklch'

export type Theme = 'light' | 'dark'
export type ColorTheme = 'custom' | 'default' | 'sky' | 'lavender' | 'mint' | 'ember' | 'spotify' | 'discord'
export type RadiusScale = 'none' | 'sm' | 'md' | 'lg' | 'xl'
export type FontId =
  | 'rajdhani'
  | 'pixelify'
  | 'inter'
  | 'geist'
  | 'outfit'
  | 'jakarta'
  | 'ibm-plex'
  | 'nunito'

export type ThemeAppearance = {
  accentLightness: number
  accentChroma: number
  accentHue: number
  baseChroma: number
  radius: RadiusScale
  fieldRadius: RadiusScale
  fontId: FontId
  preset: ColorTheme
}

export const RADIUS_SCALE: Record<
  RadiusScale,
  { rem: number; label: string; hint: string }
> = {
  none: { rem: 0, label: '–', hint: 'Sem raio' },
  sm: { rem: 0.25, label: 'S', hint: 'Pequeno' },
  md: { rem: 0.5, label: 'M', hint: 'Médio' },
  lg: { rem: 0.75, label: 'L', hint: 'Grande' },
  xl: { rem: 1, label: 'XL', hint: 'Extra grande' },
}

export const radiusHint = (radius: RadiusScale) => RADIUS_SCALE[radius].hint

export const FONT_OPTIONS: Array<{ id: FontId; label: string; family: string; href?: string }> = [
  {
    id: 'rajdhani',
    label: 'Rajdhani (CS)',
    family: '"Rajdhani", ui-sans-serif, system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap',
  },
  {
    id: 'pixelify',
    label: 'Pixelify Sans',
    family: '"Pixelify Sans", ui-sans-serif, system-ui, sans-serif',
    href: 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap',
  },
  { id: 'inter', label: 'Inter', family: '"Inter", ui-sans-serif, system-ui, sans-serif', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { id: 'geist', label: 'Geist', family: '"Geist", ui-sans-serif, system-ui, sans-serif', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap' },
  { id: 'outfit', label: 'Outfit', family: '"Outfit", ui-sans-serif, system-ui, sans-serif', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', family: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif', href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap' },
  { id: 'ibm-plex', label: 'IBM Plex Sans', family: '"IBM Plex Sans", ui-sans-serif, system-ui, sans-serif', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap' },
  { id: 'nunito', label: 'Nunito Sans', family: '"Nunito Sans", ui-sans-serif, system-ui, sans-serif', href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&display=swap' },
]

export const COLOR_PRESETS: Array<{ id: Exclude<ColorTheme, 'custom'>; label: string; hex: string; baseChroma?: number }> = [
  { id: 'default', label: 'CS2Club', hex: '#5b9a3c' },
  { id: 'sky', label: 'Sky', hex: '#0b86d4' },
  { id: 'lavender', label: 'Lavender', hex: '#a43ee8' },
  { id: 'mint', label: 'Mint', hex: '#17aa85' },
  { id: 'ember', label: 'Ember', hex: '#f27622' },
  { id: 'spotify', label: 'Spotify', hex: '#1db954' },
  { id: 'discord', label: 'Discord', hex: '#5865f2' },
]

export function appearanceFromPreset(id: Exclude<ColorTheme, 'custom'>): ThemeAppearance {
  const preset = COLOR_PRESETS.find((item) => item.id === id) ?? COLOR_PRESETS[0]
  const color = hexToOklch(preset.hex)
  return {
    accentLightness: color.l,
    accentChroma: color.c,
    accentHue: color.h,
    baseChroma: preset.baseChroma ?? 0.015,
    radius: 'md',
    fieldRadius: 'lg',
    fontId: 'rajdhani',
    preset: preset.id,
  }
}

export const DEFAULT_APPEARANCE = appearanceFromPreset('default')

export function accentCss(appearance: ThemeAppearance) {
  return `oklch(${appearance.accentLightness} ${appearance.accentChroma} ${appearance.accentHue})`
}

export function fontOption(id: FontId) {
  return FONT_OPTIONS.find((item) => item.id === id) ?? FONT_OPTIONS[0]
}

const loadedFonts = new Set<string>()

export function ensureFontLoaded(id: FontId) {
  if (typeof document === 'undefined') return
  const option = fontOption(id)
  if (!option.href || loadedFonts.has(option.id)) return
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = option.href
  link.dataset.themeFont = option.id
  document.head.appendChild(link)
  loadedFonts.add(option.id)
}
