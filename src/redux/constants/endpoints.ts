/**
 * API paths for the current CS2Club backend modules.
 * Base URL: import.meta.env.VITE_API_URL
 */

export const AUTH = {
  SIGN_IN: '/admin/auth/signin',
  REFRESH: '/admin/auth/refresh',
} as const

export const ME = {
  PROFILE: '/admin/me',
} as const

export const SKINSBACK = {
  CATALOG: '/skinsback/catalog',
  CATALOG_ITEM: '/skinsback/catalog/item',
  BALANCE: '/skinsback/balance',
} as const

export const WEAPON_CATEGORIES = {
  ROOT: '/weapon-categories',
  BY_ID: (id: string) => `/weapon-categories/${id}`,
} as const

export const USERS = {
  LIST: '/admin/users',
  BY_ID: (id: string) => `/admin/users/${id}`,
  INVENTORY: (id: string) => `/admin/users/${id}/inventory`,
} as const

export const UPLOAD = {
  SINGLE: '/upload/single',
  REPLACE: '/upload/replace',
  DELETE: '/upload/file',
} as const

export const CASES = {
  ROOT: '/admin/cases',
  BY_ID: (id: string) => `/admin/cases/${id}`,
  SIMULATE_OPENS: (id: string) => `/admin/cases/${id}/simulate-opens`,
  DUPLICATE: (id: string) => `/admin/cases/${id}/duplicate`,
} as const
