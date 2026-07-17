export type AdminMetricsSeriesGranularity = 'day' | 'month'

export type AdminDashboardMetricsSeriesRow = {
  date: string
  usersCreated: number
  caseOpensReal: number
  depositsCount: number
  revenueUsdCents: number
  payoutUsdCents: number
  marginUsdCents: number
  depositsVolumeCents: number
}

export type AdminDashboardMetricsTotals = {
  usersCreated: number
  influencersCreated: number
  caseOpensReal: number
  depositsCount: number
  bonusCreditsCount: number
  revenueUsdCents: number
  payoutUsdCents: number
  marginUsdCents: number
  depositsVolumeCents: number
}

export type AdminDashboardMetricsResponse = {
  startDate: string
  endDate: string
  seriesGranularity: AdminMetricsSeriesGranularity
  totals: AdminDashboardMetricsTotals
  series: AdminDashboardMetricsSeriesRow[]
}

export type AdminDashboardMetricsQuery = {
  startDate: string
  endDate: string
  dataEnvironment?: import('@/utils/platformDataEnvironmentStorage').PlatformDataEnvironment
}
