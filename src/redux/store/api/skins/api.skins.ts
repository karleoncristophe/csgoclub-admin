import { createApi } from '@reduxjs/toolkit/query/react'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import type { SkinWearCode } from '@/constants/skinCatalogFlags'
import { SKINSBACK } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type SkinsCatalogItem = {
  name: string
  price: number
  priceWithTax: number
  taxPercent: number
  currency: string
  valueUsd?: number
  valueBrl?: number
  valueEur?: number
  classId?: string
  availableCount?: number
  image?: string
  weaponType?: string
  rarity?: { name?: string; color?: string }
}

export type SkinItemMetadata = {
  id?: string
  name?: string
  description?: string
  marketHashName?: string
  image?: string
  minFloat?: number
  maxFloat?: number
  paintIndex?: string
  stattrak?: boolean
  souvenir?: boolean
  rarity?: { id?: string; name?: string; color?: string }
  wear?: { id?: string; name?: string }
  weapon?: { id?: string; name?: string }
  category?: { id?: string; name?: string }
  pattern?: { id?: string; name?: string }
  team?: { id?: string; name?: string }
}

export type SkinsCatalogItemDetail = SkinsCatalogItem & {
  metadata?: SkinItemMetadata | null
}

export type GetSkinsCatalogItemParams = {
  name: string
  currency?: SkinsCurrency
}

export type SkinsCatalogPriceRange = {
  min: number
  max: number
}

export type SkinsCatalogRarityOption = {
  name: string
  count: number
  color?: string
}

export type SkinsCatalogResponse = {
  items: SkinsCatalogItem[]
  total: number
  limit: number
  offset: number
  priceRange?: SkinsCatalogPriceRange
  typeCounts?: Record<string, number>
  rarityOptions?: SkinsCatalogRarityOption[]
}

export type CatalogSort = 'price_desc' | 'price_asc' | 'name_asc' | 'name_desc'

export type GetSkinsCatalogParams = {
  currency?: SkinsCurrency
  search?: string
  weaponType?: string
  rarity?: string
  wear?: SkinWearCode[]
  stattrak?: boolean
  souvenir?: boolean
  minPricePercent?: number
  maxPricePercent?: number
  minPrice?: number
  maxPrice?: number
  sort?: CatalogSort
  limit?: number
  offset?: number
}

export const skinsApi = createApi({
  reducerPath: 'skinsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['SkinsCatalog', 'SkinsCatalogItem'],
  endpoints: (builder) => ({
    getSkinsCatalog: builder.query<SkinsCatalogResponse, GetSkinsCatalogParams | void>({
      query: (params) => ({
        url: SKINSBACK.CATALOG,
        method: 'GET',
        params: {
          ...(params?.currency ? { currency: params.currency } : {}),
          ...(params?.search ? { search: params.search } : {}),
          ...(params?.weaponType ? { weaponType: params.weaponType } : {}),
          ...(params?.rarity ? { rarity: params.rarity } : {}),
          ...(params?.wear?.length ? { wear: params.wear.join(',') } : {}),
          ...(params?.stattrak ? { stattrak: true } : {}),
          ...(params?.souvenir ? { souvenir: true } : {}),
          ...(typeof params?.minPricePercent === 'number'
            ? { minPricePercent: params.minPricePercent }
            : {}),
          ...(typeof params?.maxPricePercent === 'number'
            ? { maxPricePercent: params.maxPricePercent }
            : {}),
          ...(typeof params?.minPrice === 'number' ? { minPrice: params.minPrice } : {}),
          ...(typeof params?.maxPrice === 'number' ? { maxPrice: params.maxPrice } : {}),
          ...(params?.sort ? { sort: params.sort } : {}),
          ...(typeof params?.limit === 'number' ? { limit: params.limit } : {}),
          ...(typeof params?.offset === 'number' ? { offset: params.offset } : {}),
        },
      }),
      providesTags: ['SkinsCatalog'],
    }),
    getSkinsCatalogItem: builder.query<SkinsCatalogItemDetail, GetSkinsCatalogItemParams>({
      query: ({ name, currency }) => ({
        url: SKINSBACK.CATALOG_ITEM,
        method: 'GET',
        params: {
          name,
          ...(currency ? { currency } : {}),
        },
      }),
      providesTags: (_result, _error, arg) => [
        { type: 'SkinsCatalogItem', id: arg.name },
      ],
    }),
    startSkinsCatalogExport: builder.mutation<
      { jobId: string },
      { currency: SkinsCurrency }
    >({
      query: ({ currency }) => ({
        url: SKINSBACK.CATALOG_EXPORT,
        method: 'POST',
        params: { currency },
      }),
    }),
    getSkinsCatalogExportJob: builder.query<
      {
        jobId: string
        status: 'running' | 'done' | 'error'
        percent: number
        error?: string
      },
      string
    >({
      query: (jobId) => ({
        url: SKINSBACK.CATALOG_EXPORT_JOB(jobId),
        method: 'GET',
      }),
    }),
    downloadSkinsCatalogExport: builder.mutation<Blob, string>({
      query: (jobId) => ({
        url: SKINSBACK.CATALOG_EXPORT_FILE(jobId),
        method: 'GET',
        headers: { accept: 'text/csv' },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
})

export const {
  useGetSkinsCatalogQuery,
  useLazyGetSkinsCatalogQuery,
  useGetSkinsCatalogItemQuery,
  useLazyGetSkinsCatalogItemQuery,
  useStartSkinsCatalogExportMutation,
  useLazyGetSkinsCatalogExportJobQuery,
  useDownloadSkinsCatalogExportMutation,
} = skinsApi
