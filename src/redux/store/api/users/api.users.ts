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
  lastLoginAt?: string
  tradeUrl?: string
  tradePartner?: string
  createdAt?: string
  updatedAt?: string
}

export type UserAdminDetail = AppUser & {
  tradeConfigured: boolean
  isTestAffiliate?: boolean
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
      { id: string; isTestAffiliate?: boolean }
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
  }),
})

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useGetUserInventoryQuery,
} = usersApi
