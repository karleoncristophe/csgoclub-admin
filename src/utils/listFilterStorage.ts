const STORAGE_KEY = 'cs2club-admin.list-filters.v1'

type FilterStore = Record<string, string>

function readStore(): FilterStore {
  if (typeof sessionStorage === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    return parsed as FilterStore
  } catch {
    return {}
  }
}

function writeStore(store: FilterStore) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function getStoredFilterSearch(pathname: string): string {
  return readStore()[pathname] ?? ''
}

export function writeStoredFilterSearch(pathname: string, query: string) {
  const store = readStore()
  store[pathname] = query
  writeStore(store)
}

export function pathWithStoredFilters(pathname: string): string {
  const query = getStoredFilterSearch(pathname)
  return query ? `${pathname}?${query}` : pathname
}

export function serializeKnownSearchParams(
  params: URLSearchParams,
  keys: string[],
) {
  const next = new URLSearchParams()
  for (const key of keys) {
    const value = params.get(key)
    if (value != null) next.set(key, value)
  }
  return next.toString()
}
