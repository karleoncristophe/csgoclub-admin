import { createApi } from '@reduxjs/toolkit/query/react'
import { BANNERS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type BannerLocale = 'pt-BR' | 'en-US' | 'es-ES'

export type BannerLocaleTextMap = Partial<Record<BannerLocale, string>>

export const BANNER_LOCALES: BannerLocale[] = ['pt-BR', 'en-US', 'es-ES']

export const BANNER_LOCALE_LABELS: Record<BannerLocale, string> = {
  'pt-BR': 'Português',
  'en-US': 'English',
  'es-ES': 'Español',
}

export type SiteBanner = {
  _id: string
  eyebrow?: string
  title?: string
  subtitle?: string
  eyebrowI18n?: BannerLocaleTextMap
  titleI18n?: BannerLocaleTextMap
  subtitleI18n?: BannerLocaleTextMap
  ctaLabelI18n?: BannerLocaleTextMap
  imageUrl: string
  ctaLabel?: string
  ctaHref?: string
  sortOrder: number
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export type CreateBannerPayload = {
  eyebrow?: string
  title?: string
  subtitle?: string
  eyebrowI18n?: BannerLocaleTextMap
  titleI18n?: BannerLocaleTextMap
  subtitleI18n?: BannerLocaleTextMap
  ctaLabelI18n?: BannerLocaleTextMap
  imageUrl: string
  ctaLabel?: string
  ctaHref?: string
  sortOrder?: number
  active?: boolean
}

export type UpdateBannerPayload = {
  id: string
  eyebrow?: string
  title?: string
  subtitle?: string
  eyebrowI18n?: BannerLocaleTextMap
  titleI18n?: BannerLocaleTextMap
  subtitleI18n?: BannerLocaleTextMap
  ctaLabelI18n?: BannerLocaleTextMap
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
  sortOrder?: number
  active?: boolean
}

export const bannersApi = createApi({
  reducerPath: 'bannersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Banners', 'Banner'],
  refetchOnMountOrArgChange: true,
  endpoints: (builder) => ({
    getBanners: builder.query<SiteBanner[], void>({
      query: () => ({ url: BANNERS.ROOT, method: 'GET' }),
      providesTags: ['Banners'],
    }),
    createBanner: builder.mutation<SiteBanner, CreateBannerPayload>({
      query: (body) => ({ url: BANNERS.ROOT, method: 'POST', body }),
      invalidatesTags: ['Banners'],
    }),
    updateBanner: builder.mutation<SiteBanner, UpdateBannerPayload>({
      query: ({ id, ...body }) => ({
        url: BANNERS.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        'Banners',
        { type: 'Banner', id },
      ],
    }),
    deleteBanner: builder.mutation<{ success: true }, string>({
      query: (id) => ({
        url: BANNERS.BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
  }),
})

export const {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = bannersApi
