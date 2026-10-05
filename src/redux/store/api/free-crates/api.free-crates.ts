import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import type { ArenaCrate, ArenaCrateItem } from '@/redux/store/api/arena/api.arena'
import type { PlatformDataEnvironment } from '@/utils/platformDataEnvironmentStorage'
export const FREE_KINDS = ['welcome', 'deposit_20', 'deposit_100', 'deposit_250', 'deposit_500', 'deposit_1000', 'daily'] as const
export type FreeKind = typeof FREE_KINDS[number]
export const FREE_LABELS: Record<FreeKind, string> = { welcome: 'Boas-vindas', deposit_20: 'Depósito · R$20', deposit_100: 'Depósito · R$100', deposit_250: 'Depósito · R$250', deposit_500: 'Depósito · R$500', deposit_1000: 'Depósito · R$1.000', daily: 'Resgate diário' }
export type FreeCrate = Omit<ArenaCrate, 'slug'> & {
  kind: FreeKind
  version: number
  unlockThresholdBrl?: number
  unlockThresholdUsd?: number
  unlockThresholdEur?: number
}
export type FreeCatalog = { crates: FreeCrate[]; policy: { version: number; enabled: boolean; createdAt: string; crates: (FreeCrate & { crateId: string })[] } | null; banks: { key: string; ledger: NonNullable<ArenaCrate['economyLedger']> }[] }
export type FreeGrant = { _id: string; userId: string; kind: FreeKind; period: string; status: 'available' | 'opening' | 'opened' | 'cancelled'; currency: string; isTest: boolean; createdAt: string; creditedAt?: string; depositIds: string[]; policyVersion: number; snapshot: FreeCrate; cancelReason?: string; cancelledBy?: string; result?: { item: ArenaCrateItem; method: string; bank: { balanceBefore: number; injection: number; balanceAfter: number } } }
export type FreeGrantQuery = { environment: PlatformDataEnvironment; userId?: string; kind?: string; status?: string; period?: string; page?: number }
export const freeCratesApi = createApi({
  reducerPath: 'freeCratesApi', baseQuery: baseQueryWithReauth, tagTypes: ['FreeCatalog', 'FreeGrants'],
  endpoints: builder => ({
    getFreeCrates: builder.query<FreeCatalog, PlatformDataEnvironment>({ query: () => '/admin/free-crates', providesTags: ['FreeCatalog'] }),
    saveFreeCrate: builder.mutation<FreeCrate, { kind: FreeKind; body: Omit<FreeCrate, '_id' | 'version' | 'kind'> & { expectedVersion: number } }>({ query: ({ kind, body }) => ({ url: `/admin/free-crates/${kind}`, method: 'PUT', body }), invalidatesTags: ['FreeCatalog'] }),
    publishFreeCrates: builder.mutation<unknown, { expectedVersion: number; enabled: boolean }>({ query: body => ({ url: '/admin/free-crates/publish', method: 'POST', body }), invalidatesTags: ['FreeCatalog'] }),
    getFreeGrants: builder.query<{ data: FreeGrant[]; total: number; page: number; limit: number; metrics: { _id: { status: string; currency: string }; count: number; paid: number }[] }, FreeGrantQuery>({ query: ({ environment: _environment, ...params }) => ({ url: '/admin/free-crates/grants', params }), providesTags: ['FreeGrants'] }),
    cancelFreeGrant: builder.mutation<FreeGrant, { id: string; reason: string }>({ query: ({ id, reason }) => ({ url: `/admin/free-crates/grants/${id}/cancel`, method: 'POST', body: { reason } }), invalidatesTags: ['FreeGrants'] }),
  }),
})
export const { useGetFreeCratesQuery, useSaveFreeCrateMutation, usePublishFreeCratesMutation, useGetFreeGrantsQuery, useCancelFreeGrantMutation } = freeCratesApi
