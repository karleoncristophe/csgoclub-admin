import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyAppearance,
  persistAppearance,
  readAppearance,
  readVibrantPalette,
  VIBRANT_PALETTE_STORAGE_KEY,
} from './applyAppearance'
import {
  DEFAULT_APPEARANCE,
  appearanceFromPreset,
  type ColorTheme,
  type FontId,
  type RadiusScale,
  type Theme,
  type ThemeAppearance,
} from './themeConfig'

export type { ColorTheme, FontId, RadiusScale, Theme, ThemeAppearance }

const STORAGE_KEY = 'cs2club-admin-theme'

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    if (t === 'dark' || t === 'light') return t
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

type ThemeContextValue = {
  theme: Theme
  appearance: ThemeAppearance
  colorTheme: ColorTheme
  vibrantPalette: boolean
  setTheme: (t: Theme) => void
  setAppearance: (next: ThemeAppearance | ((prev: ThemeAppearance) => ThemeAppearance)) => void
  setColorTheme: (t: Exclude<ColorTheme, 'custom'>) => void
  setVibrantPalette: (enabled: boolean) => void
  resetAppearance: () => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function syncDocumentMode(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.classList.toggle('light', theme === 'light')
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [appearance, setAppearanceState] = useState<ThemeAppearance>(readAppearance)
  const [vibrantPalette, setVibrantPaletteState] = useState(readVibrantPalette)

  useLayoutEffect(() => {
    syncDocumentMode(theme)
    document.documentElement.dataset.colorTheme = appearance.preset
    if (vibrantPalette) {
      document.documentElement.dataset.vibrantPalette = 'true'
    } else {
      delete document.documentElement.dataset.vibrantPalette
    }
    applyAppearance(theme, appearance, vibrantPalette)
    persistAppearance(appearance)
    try {
      localStorage.setItem(VIBRANT_PALETTE_STORAGE_KEY, String(vibrantPalette))
    } catch {
      /* ignore */
    }
  }, [theme, appearance, vibrantPalette])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
  }, [])

  const setAppearance = useCallback(
    (next: ThemeAppearance | ((prev: ThemeAppearance) => ThemeAppearance)) => {
      setAppearanceState((prev) => (typeof next === 'function' ? next(prev) : next))
    },
    [],
  )

  const setColorTheme = useCallback((t: Exclude<ColorTheme, 'custom'>) => {
    setAppearanceState((prev) => ({
      ...appearanceFromPreset(t),
      radius: prev.radius,
      fieldRadius: prev.fieldRadius,
      fontId: prev.fontId,
    }))
  }, [])

  const setVibrantPalette = useCallback((enabled: boolean) => {
    setVibrantPaletteState(enabled)
  }, [])

  const resetAppearance = useCallback(() => {
    setAppearanceState(DEFAULT_APPEARANCE)
    setVibrantPaletteState(false)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      appearance,
      colorTheme: appearance.preset,
      vibrantPalette,
      setTheme,
      setAppearance,
      setColorTheme,
      setVibrantPalette,
      resetAppearance,
      toggleTheme,
    }),
    [
      appearance,
      setAppearance,
      setColorTheme,
      setTheme,
      setVibrantPalette,
      resetAppearance,
      theme,
      toggleTheme,
      vibrantPalette,
    ],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
