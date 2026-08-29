import { createApi } from '@reduxjs/toolkit/query/react'
import { CAMBIO } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type CambioApiProvider = 'skinsback' | 'awesomeapi' | 'frankfurter'

export type CambioApiCatalogItem = {
  value: CambioApiProvider | string
  label: string
  description: string
}

export type CambioSettings = {
  provider: CambioApiProvider | string
  providers: CambioApiCatalogItem[]
  updatedAt?: string
  updatedBy?: string
}

export const cambioApi = createApi({
  reducerPath: 'cambioApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['CambioSettings'],
  endpoints: (builder) => ({
    getCambioSettings: builder.query<CambioSettings, void>({
      query: () => ({ url: CAMBIO.SETTINGS, method: 'GET' }),
      providesTags: ['CambioSettings'],
    }),
    updateCambioSettings: builder.mutation<
      CambioSettings,
      { provider: string }
    >({
      query: (body) => ({ url: CAMBIO.SETTINGS, method: 'PATCH', body }),
      invalidatesTags: ['CambioSettings'],
    }),
  }),
})

export const {
  useGetCambioSettingsQuery,
  useUpdateCambioSettingsMutation,
} = cambioApi
