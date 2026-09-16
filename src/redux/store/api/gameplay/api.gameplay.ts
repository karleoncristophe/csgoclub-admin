import { createApi } from '@reduxjs/toolkit/query/react'
import { GAMEPLAY } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type AdminGameplayResetResult = {
  environment: 'PRODUCTION' | 'SANDBOX'
  usersAffected: number
  deleted: {
    caseOpens: number
    inventoryItems: number
    upgradePlays: number
    swaps: number
    battles: number
    arenaCrateOpens: number
    arenaMatches: number
    arenaPlayers: number
    walletTransactions: number
  }
}

export const gameplayApi = createApi({
  reducerPath: 'gameplayApi',
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    resetGameplay: builder.mutation<AdminGameplayResetResult, void>({
      query: () => ({
        url: GAMEPLAY.RESET,
        method: 'POST',
      }),
    }),
  }),
})

export const { useResetGameplayMutation } = gameplayApi
