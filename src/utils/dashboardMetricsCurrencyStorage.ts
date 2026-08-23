import type { AdminDashboardCurrency } from '@/types/adminMetrics'
import { ADMIN_DASHBOARD_CURRENCIES } from '@/types/adminMetrics'

const STORAGE_KEY = 'cs2club-admin-dashboard-metrics-currency'

function isDashboardCurrency(value: string): value is AdminDashboardCurrency {
  return ADMIN_DASHBOARD_CURRENCIES.includes(value as AdminDashboardCurrency)
}

export function loadStoredMetricsCurrency(): AdminDashboardCurrency {
  if (typeof window === 'undefined') return 'USD'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw && isDashboardCurrency(raw)) return raw
  } catch {
    /* ignore */
  }
  return 'USD'
}

export function saveStoredMetricsCurrency(currency: AdminDashboardCurrency) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, currency)
}
