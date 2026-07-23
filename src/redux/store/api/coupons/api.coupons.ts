import { createApi } from '@reduxjs/toolkit/query/react'
import { COUPONS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type AdminCouponRewardType =
  | 'DEPOSIT_PERCENT'
  | 'DEPOSIT_FIXED'
  | 'DEPOSIT_BONUS_PERCENT'
  | 'DEPOSIT_CASHBACK_PERCENT'
  | 'CASE_PRICE_PERCENT'
  | 'CASE_PRICE_FIXED'
  | 'FREE_CASE_OPEN'
  | 'UPGRADE_PERCENT'
  | 'UPGRADE_BONUS_CHANCE'
  | 'WITHDRAW_FEE_DISCOUNT_PERCENT'
  | 'LOYALTY_POINTS_MULTIPLIER'
  | 'BATTLEPASS_XP_BOOST'
  | 'CUSTOM'
export type AdminCouponCampaignType = 'INFLUENCER' | 'PUBLIC'

export type CouponRewardPreset = {
  type: AdminCouponRewardType
  label: string
  description: string
  category: 'deposit' | 'case' | 'upgrade' | 'withdraw' | 'loyalty' | 'battlepass' | 'custom'
  valueKind: 'percent' | 'fixed' | 'multiplier' | 'count' | 'custom'
  minValue: number
  maxValue: number
  step: number
  defaultValue: number
  futureUse: boolean
}

export type AdminCoupon = {
  _id: string
  code: string
  description?: string
  ownerUserId: string
  ownerUserName?: string
  campaignType: AdminCouponCampaignType
  rewardType: AdminCouponRewardType
  rewardValue: number
  maxUses?: number
  active: boolean
  validFrom: string
  validTo: string
  assignedUsersCount: number
  isExpired: boolean
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export type CouponsListResponse = {
  data: AdminCoupon[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type GetCouponsParams = {
  page?: number
  limit?: number
  search?: string
  ownerUserId?: string
  active?: boolean
}

export type CreateCouponPayload = {
  code: string
  description?: string
  ownerUserId: string
  campaignType?: AdminCouponCampaignType
  rewardType?: AdminCouponRewardType
  rewardValue?: number
  maxUses?: number
  active?: boolean
  validFrom?: string
  validTo: string
  metadata?: Record<string, unknown>
}

export type UpdateCouponPayload = Partial<CreateCouponPayload> & { id: string }

export const couponsApi = createApi({
  reducerPath: 'couponsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Coupons'],
  endpoints: (builder) => ({
    getCouponRewardPresets: builder.query<CouponRewardPreset[], void>({
      query: () => ({
        url: COUPONS.REWARD_TYPES,
        method: 'GET',
      }),
      providesTags: ['Coupons'],
    }),
    getCoupons: builder.query<CouponsListResponse, GetCouponsParams | void>({
      query: (params) => ({
        url: COUPONS.ROOT,
        method: 'GET',
        params: {
          ...(params?.page != null ? { page: params.page } : {}),
          ...(params?.limit != null ? { limit: params.limit } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.ownerUserId ? { ownerUserId: params.ownerUserId } : {}),
          ...(params?.active != null ? { active: params.active } : {}),
        },
      }),
      providesTags: ['Coupons'],
    }),
    createCoupon: builder.mutation<AdminCoupon, CreateCouponPayload>({
      query: (body) => ({
        url: COUPONS.ROOT,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Coupons'],
    }),
    updateCoupon: builder.mutation<AdminCoupon, UpdateCouponPayload>({
      query: ({ id, ...body }) => ({
        url: COUPONS.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Coupons'],
    }),
    deleteCoupon: builder.mutation<{ success: true }, string>({
      query: (id) => ({
        url: COUPONS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupons'],
    }),
  }),
})

export const {
  useGetCouponRewardPresetsQuery,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} = couponsApi
