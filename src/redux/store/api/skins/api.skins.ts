import { createApi } from '@reduxjs/toolkit/query/react'
import { SKINSBACK } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type SkinsCatalogItem = {
  name: string
  price: number
  priceWithTax: number
  taxPercent: number
  currency: string
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
  currency?: string
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

export type GetSkinsCatalogParams = {
  currency?: string
  search?: string
  weaponType?: string
  rarity?: string
  minPricePercent?: number
  maxPricePercent?: number
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
          ...(typeof params?.minPricePercent === 'number'
            ? { minPricePercent: params.minPricePercent }
            : {}),
          ...(typeof params?.maxPricePercent === 'number'
            ? { maxPricePercent: params.maxPricePercent }
            : {}),
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
  }),
})

export const {
  useGetSkinsCatalogQuery,
  useLazyGetSkinsCatalogQuery,
  useGetSkinsCatalogItemQuery,
} = skinsApi
