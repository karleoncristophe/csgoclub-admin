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

export const ADMIN_ACCOUNTS = {
  ROOT: '/admin/accounts',
  BY_ID: (id: string) => `/admin/accounts/${id}`,
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
  SITE_INVENTORY: (id: string) => `/admin/users/${id}/site-inventory`,
  CASE_OPENS: (id: string) => `/admin/users/${id}/case-opens`,
  CASE_OPEN_BY_ID: (userId: string, openId: string) =>
    `/admin/users/${userId}/case-opens/${openId}`,
  CONVERT_ALL_SITE_INVENTORY: (id: string) =>
    `/admin/users/${id}/site-inventory/convert-all`,
  RESOLVE_TEST_CASE_OPEN: (userId: string, openId: string) =>
    `/admin/users/${userId}/case-opens/${openId}/disposition`,
  KYC: (id: string) => `/admin/users/${id}/kyc`,
} as const

export const UPLOAD = {
  SINGLE: '/upload/single',
  REPLACE: '/upload/replace',
  DELETE: '/upload/file',
} as const

export const CASES = {
  ROOT: '/admin/cases',
  BY_ID: (id: string) => `/admin/cases/${id}`,
  DETAILS: (id: string) => `/admin/cases/${id}/details`,
  DUPLICATE: (id: string) => `/admin/cases/${id}/duplicate`,
} as const

export const CASE_OPENS = {
  ROOT: '/admin/case-opens',
  BY_ID: (openId: string) => `/admin/case-opens/${openId}`,
} as const

export const TRADES = {
  ROOT: '/admin/trades',
} as const

export const CASE_VITRINES = {
  ROOT: '/case-vitrines',
  BY_ID: (id: string) => `/case-vitrines/${id}`,
  CATALOG: '/case-vitrines/catalog',
} as const

export const BANNERS = {
  ROOT: '/banners',
  BY_ID: (id: string) => `/banners/${id}`,
  CATALOG: '/banners/catalog',
} as const

export const METRICS = {
  DASHBOARD: '/admin/metrics/dashboard',
  ONLINE: '/admin/metrics/online',
} as const

export const COUPONS = {
  ROOT: '/admin/coupons',
  REWARD_TYPES: '/admin/coupons/reward-types',
  BY_ID: (id: string) => `/admin/coupons/${id}`,
} as const

export const AI_ASSISTANT = {
  STATUS: '/admin/ai/status',
  CASE_ASSISTANT: '/admin/ai/case-assistant',
} as const

export const BATTLES_ADMIN = {
  ROOT: '/admin/battles',
  BY_ID: (id: string) => `/admin/battles/${id}`,
  CANCEL: (id: string) => `/admin/battles/${id}/cancel`,
  BOTS: '/admin/battles/bots',
  BOT_BY_ID: (id: string) => `/admin/battles/bots/${id}`,
} as const

export const ARENA = {
  CRATES: '/admin/arena/crates',
  CRATE_BY_ID: (id: string) => `/admin/arena/crates/${id}`,
  PRICING: '/admin/arena/pricing',
  PRICING_HISTORY: '/admin/arena/pricing/history',
  MATCHES: '/admin/arena/matches',
  MATCH_BY_ID: (id: string) => `/admin/arena/matches/${id}`,
} as const

export const CAMBIO = {
  SETTINGS: '/admin/cambio/settings',
} as const

export const PAYMENT = {
  PROVIDERS: '/admin/payment/providers',
  PROVIDER: (provider: string) => `/admin/payment/providers/${provider}`,
} as const
