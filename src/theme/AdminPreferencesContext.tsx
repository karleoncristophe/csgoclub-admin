import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  currencyForCountry,
  detectBrowserCountryCode,
  isSupportedCountryCode,
} from '@/constants/countryCurrency'
import { normalizeSkinsCurrency, SkinsCurrency } from '@/constants/skinsCurrency'

const STORAGE_KEY = 'cs2club-admin-preferences'

type StoredAdminPreferences = {
  countryCode: string
  skinsCurrency: SkinsCurrency
}

type AdminPreferencesContextValue = {
  countryCode: string
  skinsCurrency: SkinsCurrency
  setCountryCode: (countryCode: string) => void
  setSkinsCurrency: (currency: SkinsCurrency) => void
}

function readStoredPreferences(): StoredAdminPreferences | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredAdminPreferences>
    const countryCode =
      typeof parsed.countryCode === 'string' && parsed.countryCode.trim()
        ? parsed.countryCode.trim().toUpperCase()
        : null
    const skinsCurrency = normalizeSkinsCurrency(parsed.skinsCurrency)

    if (!countryCode) return null

    return {
      countryCode: isSupportedCountryCode(countryCode) ? countryCode : 'OTHER',
      skinsCurrency,
    }
  } catch {
    return null
  }
}

function buildDefaultPreferences(): StoredAdminPreferences {
  const countryCode = detectBrowserCountryCode()
  return {
    countryCode,
    skinsCurrency: currencyForCountry(countryCode),
  }
}

function readPreferences(): StoredAdminPreferences {
  return readStoredPreferences() ?? buildDefaultPreferences()
}

function persistPreferences(preferences: StoredAdminPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  } catch {
    /* ignore */
  }
}

const AdminPreferencesContext = createContext<AdminPreferencesContextValue | null>(null)

export function AdminPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<StoredAdminPreferences>(readPreferences)

  useEffect(() => {
    persistPreferences(preferences)
  }, [preferences])

  const setCountryCode = useCallback((countryCode: string) => {
    const normalized = countryCode.trim().toUpperCase()
    const safeCountry = isSupportedCountryCode(normalized) ? normalized : 'OTHER'
    setPreferences({
      countryCode: safeCountry,
      skinsCurrency: currencyForCountry(safeCountry),
    })
  }, [])

  const setSkinsCurrency = useCallback((currency: SkinsCurrency) => {
    setPreferences((current) => ({
      ...current,
      skinsCurrency: normalizeSkinsCurrency(currency),
    }))
  }, [])

  const value = useMemo(
    () => ({
      countryCode: preferences.countryCode,
      skinsCurrency: preferences.skinsCurrency,
      setCountryCode,
      setSkinsCurrency,
    }),
    [preferences.countryCode, preferences.skinsCurrency, setCountryCode, setSkinsCurrency],
  )

  return (
    <AdminPreferencesContext.Provider value={value}>
      {children}
    </AdminPreferencesContext.Provider>
  )
}

export function useAdminPreferences(): AdminPreferencesContextValue {
  const ctx = useContext(AdminPreferencesContext)
  if (!ctx) {
    throw new Error('useAdminPreferences must be used within AdminPreferencesProvider')
  }
  return ctx
}
