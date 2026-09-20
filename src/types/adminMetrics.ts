export type AdminMetricsSeriesGranularity = 'day' | 'month'

export type AdminDashboardCurrency = 'BRL' | 'USD' | 'EUR'

export type AdminDashboardMetricsMoneyFields = {
  revenueUsdCents: number
  revenueBrlCents: number
  revenueEurCents: number
  payoutUsdCents: number
  payoutBrlCents: number
  payoutEurCents: number
  marginUsdCents: number
  marginBrlCents: number
  marginEurCents: number
  depositsVolumeUsdCents: number
  depositsVolumeBrlCents: number
  depositsVolumeEurCents: number
  /** Alias of depositsVolumeUsdCents (legacy). */
  depositsVolumeCents: number
}

/** Economia das caixas e battles com bot em uma moeda nativa (valores em unidades, não centavos). */
export type AdminDashboardEconomyCurrency = {
  currency: AdminDashboardCurrency
  totalOpens: number
  /** Σ (VE injetado − item entregue) no período: é o que move o banco virtual. */
  variableMarginValue: number
  /** Σ (preço pago − VE injetado) no período: ganho fixo garantido. */
  fixedMarginValue: number
  averageFixedMarginPerOpen: number
  /** Saldo atual somado dos bancos virtuais nesta moeda (não depende do período). */
  virtualBankBalance: number
  /** Prêmio que bots perderam em battles (debitado do banco das caixas). */
  botPrizeLost: number
  botLossCount: number
  /** Prêmio que clientes ganharam em battles contra bots. */
  clientPrizeWon: number
  clientWinCount: number
}

export type AdminDashboardMetricsSeriesRow = {
  date: string
  usersCreated: number
  caseOpensReal: number
  depositsCount: number
} & AdminDashboardMetricsMoneyFields

export type AdminDashboardMetricsTotals = {
  usersCreated: number
  influencersCreated: number
  caseOpensReal: number
  depositsCount: number
  bonusCreditsCount: number
} & AdminDashboardMetricsMoneyFields

export type AdminDashboardMetricsResponse = {
  startDate: string
  endDate: string
  seriesGranularity: AdminMetricsSeriesGranularity
  onlineCount: number
  totals: AdminDashboardMetricsTotals
  series: AdminDashboardMetricsSeriesRow[]
  /** Economia das caixas e battles com bot, por moeda nativa. */
  economy?: AdminDashboardEconomyCurrency[]
}

export type AdminOnlineMetricsResponse = {
  onlineCount: number
}

export type AdminDashboardMetricsQuery = {
  startDate: string
  endDate: string
  dataEnvironment?: import('@/utils/platformDataEnvironmentStorage').PlatformDataEnvironment
}

export const ADMIN_DASHBOARD_CURRENCIES: AdminDashboardCurrency[] = [
  'BRL',
  'USD',
  'EUR',
]

export function metricsMoneyKeys(currency: AdminDashboardCurrency) {
  switch (currency) {
    case 'BRL':
      return {
        revenue: 'revenueBrlCents' as const,
        payout: 'payoutBrlCents' as const,
        margin: 'marginBrlCents' as const,
        depositsVolume: 'depositsVolumeBrlCents' as const,
      }
    case 'EUR':
      return {
        revenue: 'revenueEurCents' as const,
        payout: 'payoutEurCents' as const,
        margin: 'marginEurCents' as const,
        depositsVolume: 'depositsVolumeEurCents' as const,
      }
    default:
      return {
        revenue: 'revenueUsdCents' as const,
        payout: 'payoutUsdCents' as const,
        margin: 'marginUsdCents' as const,
        depositsVolume: 'depositsVolumeUsdCents' as const,
      }
  }
}
