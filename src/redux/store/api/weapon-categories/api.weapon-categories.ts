import { createApi } from '@reduxjs/toolkit/query/react'
import { WEAPON_CATEGORIES } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'
import { skinsApi } from '@/redux/store/api/skins/api.skins'

export type WeaponCategory = {
  _id: string
  name: string
  taxPercent: number
  createdAt?: string
  updatedAt?: string
}

export type CreateWeaponCategoryPayload = {
  name: string
  taxPercent: number
}

export type UpdateWeaponCategoryPayload = {
  id: string
  name?: string
  taxPercent?: number
}

export const weaponCategoriesApi = createApi({
  reducerPath: 'weaponCategoriesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['WeaponCategories'],
  endpoints: (builder) => ({
    getWeaponCategories: builder.query<WeaponCategory[], void>({
      query: () => ({
        url: WEAPON_CATEGORIES.ROOT,
        method: 'GET',
      }),
      providesTags: ['WeaponCategories'],
    }),
    createWeaponCategory: builder.mutation<
      WeaponCategory,
      CreateWeaponCategoryPayload
    >({
      query: (body) => ({
        url: WEAPON_CATEGORIES.ROOT,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['WeaponCategories'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(skinsApi.util.invalidateTags(['SkinsCatalog']))
      },
    }),
    updateWeaponCategory: builder.mutation<
      WeaponCategory,
      UpdateWeaponCategoryPayload
    >({
      query: ({ id, ...body }) => ({
        url: WEAPON_CATEGORIES.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['WeaponCategories'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled
        dispatch(skinsApi.util.invalidateTags(['SkinsCatalog']))
      },
    }),
  }),
})

export const {
  useGetWeaponCategoriesQuery,
  useCreateWeaponCategoryMutation,
  useUpdateWeaponCategoryMutation,
} = weaponCategoriesApi
