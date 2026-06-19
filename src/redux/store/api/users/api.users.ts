import { createApi } from '@reduxjs/toolkit/query/react'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import { USERS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type AppUser = {
  _id: string
  steamId: string
  name: string
  profileUrl?: string
  avatar?: string
  avatarMedium?: string
  avatarFull?: string
  deleted?: boolean
  active?: boolean
  role?: 'ADMIN' | 'USER'
  userType?: 'standard' | 'influencer'
  isTestAffiliate?: boolean
  lastLoginAt?: string
  tradeUrl?: string
  tradePartner?: string
  createdAt?: string
  updatedAt?: string
}

export type UserAdminDetail = AppUser & {
  tradeConfigured: boolean
  isTestAffiliate?: boolean
  userType: 'standard' | 'influencer'
  balance: number
  bonusBalance: number
  totalSpendable: number
  withdrawableBalance: number
  walletCurrency: SkinsCurrency
}

export type UserCaseOpenBulkResult = {
  caseId: string
  caseName: string
  count: number
  disposition: 'keep' | 'convert'
  openPrice: number
  totalPaid: number
  totalWonValue: number
  creditedAmount?: number
  inventoryItemsCreated: number
  items: Array<{
    skinName: string
    image?: string
    value: number
    walletValue: number
    walletCurrency: string
    disposition: 'kept' | 'converted'
    dropResolutionMethod: 'direct' | 'reroll' | 'fallback'
    wasRerolled: boolean
  }>
  balances: {
    balance: number
    bonusBalance: number
    totalSpendable: number
    withdrawableBalance: number
  }
  testLedgerAfter: {
    totalRevenue: number
    totalPayout: number
    totalRealOpens: number
  }
  dropSummary: {
    directCount: number
    rerollCount: number
    fallbackCount: number
    marginPercent: number
  }
}

export type CaseOpenRecord = {
  _id: string
  caseId: string
  userId: string
  wonSkinName: string
  pricePaid: number
  itemValue: number
  currency: string
  valueUsd?: number
  valueBrl?: number
  valueEur?: number
  isTestOpen: boolean
  disposition: 'pending' | 'kept' | 'converted'
  wonItemImage?: string
  wonItemRarityName?: string
  wonItemRarityColor?: string
  convertedAmount?: number
  createdAt?: string
}

export type UserCaseOpenResult = {
  open: CaseOpenRecord
  wonItem: {
    skinName: string
    image?: string
    price: number
    rarity?: { name?: string; color?: string }
  }
  balances: {
    balance: number
    bonusBalance: number
    totalSpendable: number
    withdrawableBalance: number
  }
}

export type ResolveCaseOpenResult = {
  open: CaseOpenRecord
  inventoryItem?: SiteInventoryItem
  creditedAmount?: number
  balances: UserCaseOpenResult['balances']
}

export type SiteInventoryGroupedItem = {
  skinName: string
  image?: string
  rarityName?: string
  rarityColor?: string
  value: number
  currency: string
  status: 'active' | 'converted'
  count: number
  totalValue: number
  latestCreatedAt?: string
}

export type SiteInventoryItem = {
  _id: string
  userId: string
  caseOpenId: string
  caseId: string
  skinName: string
  image?: string
  rarityName?: string
  rarityColor?: string
  value: number
  currency: string
  valueUsd?: number
  valueBrl?: number
  valueEur?: number
  status: 'active' | 'converted'
  source: 'case_open'
  convertedAt?: string
  convertedAmount?: number
  createdAt?: string
  updatedAt?: string
}

export type SiteInventorySummary = {
  activeCount: number
  activeTotalValue: number
  convertedCount: number
  convertedTotalValue: number
  filteredTotalValue: number
  currency: string
}

export type SiteInventoryResponse = {
  data: SiteInventoryItem[] | SiteInventoryGroupedItem[]
  grouped: boolean
  total: number
  totalItems: number
  page: number
  limit: number
  totalPages: number
  summary: SiteInventorySummary
}

export type GetSiteInventoryParams = {
  userId: string
  page?: number
  limit?: number
  status?: 'active' | 'converted'
  grouped?: boolean
}

export type UserInventoryItem = {
  id: string
  assetId: string
  name: string
  image: string
  tradable: boolean
  disabled: boolean
  price: number | null
  priceLocal: number | null
  multipliedPriceLocal: number | null
  currency: SkinsCurrency | string
  classId?: string
  wear?: string
  itemType?: string
  weaponType?: string
  marketable?: boolean
  rarity?: { name?: string; color?: string }
}

export type UserInventoryRarityOption = {
  name: string
  count: number
  color?: string
}

export type UserInventoryResponse = {
  items: UserInventoryItem[]
  total: number
  limit: number
  offset: number
  totalInventoryCount?: number
  priceRange?: { min: number; max: number }
  typeCounts?: Record<string, number>
  rarityOptions?: UserInventoryRarityOption[]
}

export type GetUserInventoryParams = {
  userId: string
  currency?: SkinsCurrency
  search?: string
  weaponType?: string
  rarity?: string
  tradable?: boolean
  limit?: number
  offset?: number
}

export type UserListPaginatedDto = {
  data: AppUser[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type GetUsersParams = {
  page?: number
  limit?: number
  search?: string
  role?: 'ADMIN' | 'USER'
  active?: boolean
  includeDeleted?: boolean
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query<UserListPaginatedDto, GetUsersParams | void>({
      query: (params) => ({
        url: USERS.LIST,
        method: 'GET',
        params: {
          ...(params?.page != null ? { page: params.page } : {}),
          ...(params?.limit != null ? { limit: params.limit } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.role ? { role: params.role } : {}),
          ...(params?.active != null ? { active: params.active } : {}),
          ...(params?.includeDeleted != null
            ? { includeDeleted: params.includeDeleted }
            : {}),
        },
      }),
      providesTags: ['Users'],
    }),
    getUserById: builder.query<UserAdminDetail, string>({
      query: (id) => ({
        url: USERS.BY_ID(id),
        method: 'GET',
      }),
      providesTags: (_result, _error, id) => [{ type: 'Users', id }],
    }),
    updateUser: builder.mutation<
      UserAdminDetail,
      {
        id: string
        userType?: 'standard' | 'influencer'
        isTestAffiliate?: boolean
        addBonusBalance?: number
      }
    >({
      query: ({ id, ...body }) => ({
        url: USERS.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Users', id }],
    }),
    getUserInventory: builder.query<UserInventoryResponse, GetUserInventoryParams>({
      query: ({ userId, ...params }) => ({
        url: USERS.INVENTORY(userId),
        method: 'GET',
        params: {
          ...(params.currency ? { currency: params.currency } : {}),
          ...(params.search ? { search: params.search } : {}),
          ...(params.weaponType ? { weaponType: params.weaponType } : {}),
          ...(params.rarity ? { rarity: params.rarity } : {}),
          ...(params.tradable != null ? { tradable: params.tradable } : {}),
          ...(params.limit != null ? { limit: params.limit } : {}),
          ...(params.offset != null ? { offset: params.offset } : {}),
        },
      }),
      providesTags: (_result, _error, { userId }) => [
        { type: 'Users', id: `${userId}-inventory` },
      ],
    }),
    getUserSiteInventory: builder.query<SiteInventoryResponse, GetSiteInventoryParams>({
      query: ({ userId, ...params }) => ({
        url: USERS.SITE_INVENTORY(userId),
        method: 'GET',
        params: {
          ...(params.page != null ? { page: params.page } : {}),
          ...(params.limit != null ? { limit: params.limit } : {}),
          ...(params.status ? { status: params.status } : {}),
          ...(params.grouped != null ? { grouped: params.grouped } : {}),
        },
      }),
      providesTags: (_result, _error, { userId }) => [
        { type: 'Users', id: `${userId}-site-inventory` },
      ],
    }),
    openUserTestCase: builder.mutation<
      UserCaseOpenBulkResult,
      {
        userId: string
        caseId: string
        count?: number
        disposition?: 'keep' | 'convert'
      }
    >({
      query: ({ userId, caseId, count, disposition }) => ({
        url: USERS.OPEN_TEST_CASE(userId, caseId),
        method: 'POST',
        body: {
          ...(count != null ? { count } : {}),
          ...(disposition ? { disposition } : {}),
        },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Users', id: userId },
        { type: 'Users', id: `${userId}-site-inventory` },
        'Cases',
      ],
    }),
    resolveUserTestCaseOpen: builder.mutation<
      ResolveCaseOpenResult,
      { userId: string; openId: string; action: 'keep' | 'convert' }
    >({
      query: ({ userId, openId, action }) => ({
        url: USERS.RESOLVE_TEST_CASE_OPEN(userId, openId),
        method: 'POST',
        body: { action },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'Users', id: userId },
        { type: 'Users', id: `${userId}-site-inventory` },
      ],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useGetUserInventoryQuery,
  useGetUserSiteInventoryQuery,
  useOpenUserTestCaseMutation,
  useResolveUserTestCaseOpenMutation,
} = usersApi
