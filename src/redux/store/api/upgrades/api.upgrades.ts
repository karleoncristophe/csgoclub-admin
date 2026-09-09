import { createApi } from '@reduxjs/toolkit/query/react'
import { UPGRADES_ADMIN } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import {
  omitDataEnvironmentQueryArg,
  type WithPlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

export type UpgradeCurrency = 'BRL' | 'USD' | 'EUR'
export type UpgradeResult = 'won' | 'lost'
export type UpgradeSort =
  | 'newest'
  | 'oldest'
  | 'stake_desc'
  | 'payout_desc'
  | 'profit_desc'
  | 'chance_desc'

export type UpgradeTarget = {
  name: string
  image?: string
  rarityName?: string
  rarityColor?: string
  classId?: string
  valueCents?: number
}

export type UpgradePlayer = {
  id: string
  name: string
  steamId: string
  avatar?: string
}

export type AdminUpgradeItem = {
  id: string
  createdAt: string
  currency: UpgradeCurrency
  result: UpgradeResult
  player: UpgradePlayer | null
  sourceItemsCount: number
  sourceItemsTotalCents: number
  balanceUsedCents: number
  sourceTotalCents: number
  paymentFromBalanceCents: number
  paymentFromBonusBalanceCents: number
  target: UpgradeTarget & { valueCents: number }
  chancePercent: number
  payoutCents: number
  grossProfitCents: number
  marginPercent: number
  expectedPayoutCents: number
  expectedProfitCents: number
}

export type AdminUpgradeSummary = {
  totalPlays: number
  wins: number
  losses: number
  winRatePercent: number
  expectedWins: number
  expectedWinRatePercent: number
  luckDeltaPercent: number
  averageChancePercent: number
  totalStakedCents: number
  totalPayoutCents: number
  grossProfitCents: number
  marginPercent: number
  rtpPercent: number
  expectedPayoutCents: number
  expectedProfitCents: number
  expectedMarginPercent: number
  profitVsExpectedCents: number
  averageStakeCents: number
  averagePayoutOnWinCents: number
  sourceItemsStakeCents: number
  balanceStakeCents: number
  regularBalanceStakeCents: number
  bonusBalanceStakeCents: number
}

export type AdminUpgradeSeriesRow = {
  date: string
  plays: number
  wins: number
  losses: number
  stakedCents: number
  payoutCents: number
  profitCents: number
  expectedPayoutCents: number
  marginPercent: number
}

export type AdminUpgradeTargetMetrics = {
  target: UpgradeTarget
  attempts: number
  wins: number
  losses: number
  winRatePercent: number
  expectedWinRatePercent: number
  averageChancePercent: number
  stakedCents: number
  payoutCents: number
  grossProfitCents: number
  marginPercent: number
  expectedPayoutCents: number
}

export type AdminUpgradeChanceBucket = {
  label: string
  plays: number
  wins: number
  actualWinRatePercent: number
  expectedWinRatePercent: number
  stakedCents: number
  payoutCents: number
  grossProfitCents: number
  marginPercent: number
}

export type AdminUpgradeAnalyticsResponse = {
  items: AdminUpgradeItem[]
  total: number
  page: number
  limit: number
  totalPages: number
  currency: UpgradeCurrency
  filters: {
    from: string
    to: string
    result: UpgradeResult | null
    search: string | null
  }
  summary: AdminUpgradeSummary
  seriesGranularity: 'day' | 'month'
  series: AdminUpgradeSeriesRow[]
  targets: AdminUpgradeTargetMetrics[]
  chanceBuckets: AdminUpgradeChanceBucket[]
}

export type GetAdminUpgradeAnalyticsParams = WithPlatformDataEnvironment<{
  page?: number
  limit?: number
  currency: UpgradeCurrency
  result?: UpgradeResult
  from?: string
  to?: string
  sort?: UpgradeSort
  search?: string
}>

export const upgradesAdminApi = createApi({
  reducerPath: 'upgradesAdminApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    getAdminUpgradeAnalytics: builder.query<
      AdminUpgradeAnalyticsResponse,
      GetAdminUpgradeAnalyticsParams
    >({
      query: (args) => ({
        url: UPGRADES_ADMIN.ROOT,
        params: omitDataEnvironmentQueryArg(args),
      }),
    }),
  }),
})

export const { useGetAdminUpgradeAnalyticsQuery } = upgradesAdminApi
