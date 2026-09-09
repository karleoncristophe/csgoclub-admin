import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import {
  serializeKnownSearchParams,
  writeStoredFilterSearch,
} from '@/utils/listFilterStorage'

type FilterMap = Record<string, string>

type SetFiltersOptions = {
  /** When true (default), sets `page` back to its default if the schema has `page` and patch omits it. */
  resetPage?: boolean
}

/**
 * Syncs filter state with URL search params so navigating back keeps the filters.
 * Empty or default values are omitted from the URL.
 *
 * Pass a stable `defaults` object (module-level const) to avoid extra renders.
 */
export function useUrlFilters<T extends FilterMap>(defaults: T) {
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultsRef = useRef(defaults)
  defaultsRef.current = defaults

  const filters = useMemo(() => {
    const next = { ...defaults }
    for (const key of Object.keys(defaults)) {
      const raw = searchParams.get(key)
      if (raw != null) {
        ;(next as FilterMap)[key] = raw
      }
    }
    return next
  }, [searchParams, defaults])

  useEffect(() => {
    const query = serializeKnownSearchParams(
      searchParams,
      Object.keys(defaultsRef.current),
    )
    writeStoredFilterSearch(pathname, query)
  }, [pathname, searchParams])

  const setFilters = useCallback(
    (patch: Partial<T>, options?: SetFiltersOptions) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          const current: FilterMap = { ...defaults }
          for (const key of Object.keys(defaults)) {
            const raw = prev.get(key)
            if (raw != null) current[key] = raw
          }

          const merged: FilterMap = { ...current, ...(patch as FilterMap) }

          const shouldResetPage =
            options?.resetPage !== false &&
            Object.prototype.hasOwnProperty.call(defaults, 'page') &&
            !Object.prototype.hasOwnProperty.call(patch, 'page')

          if (shouldResetPage) {
            merged.page = defaults.page
          }

          for (const key of Object.keys(defaults)) {
            const fallback = defaults[key]
            const value = merged[key] ?? fallback
            if (value === '' || value === fallback) {
              next.delete(key)
            } else {
              next.set(key, value)
            }
          }

          return next
        },
        { replace: true },
      )
    },
    [defaults, setSearchParams],
  )

  const setFilter = useCallback(
    <K extends keyof T & string>(
      key: K,
      value: T[K],
      options?: SetFiltersOptions,
    ) => {
      setFilters({ [key]: value } as unknown as Partial<T>, options)
    },
    [setFilters],
  )

  return { filters, setFilters, setFilter, searchParams, setSearchParams }
}

export function parsePositiveInt(value: string, fallback: number) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.floor(n)
}

export function parseBoundedInt(
  value: string,
  fallback: number,
  min: number,
  max: number,
) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.floor(n)))
}
