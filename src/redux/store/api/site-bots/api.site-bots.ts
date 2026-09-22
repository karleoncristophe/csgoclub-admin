import { createApi } from '@reduxjs/toolkit/query/react'
import { SITE_BOTS } from '@/redux/constants/endpoints'
import { baseQueryWithReauth } from '@/redux/store/api/global.api'

export type AdminSiteBot = {
  _id: string
  name: string
  nameKey?: string
  avatarUrl?: string
  balance?: number
  active: boolean
  lastShownAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type SiteBotsStatus = {
  enabled: boolean
  nextAt: string | null
}

export type SiteBotNameImportStatus =
  | 'created'
  | 'invalid'
  | 'duplicate_in_request'
  | 'already_exists'

export type SiteBotNameImportResult = {
  requested: number
  created: number
  skipped: number
  results: Array<{ index: number; name: string; status: SiteBotNameImportStatus }>
}

export type SiteBotNameRenameStatus =
  | 'updated'
  | 'invalid'
  | 'duplicate_in_request'
  | 'already_exists'
  | 'unchanged'
  | 'not_found'

export type SiteBotNameRenameResult = {
  requested: number
  updated: number
  skipped: number
  results: Array<{
    index: number
    id: string
    name: string
    currentName?: string
    status: SiteBotNameRenameStatus
  }>
}

export const siteBotsApi = createApi({
  reducerPath: 'siteBotsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['SiteBots'],
  endpoints: (builder) => ({
    getSiteBots: builder.query<AdminSiteBot[], void>({
      query: () => ({ url: SITE_BOTS.ROOT, method: 'GET' }),
      providesTags: ['SiteBots'],
    }),
    getSiteBotsStatus: builder.query<SiteBotsStatus, void>({
      query: () => ({ url: SITE_BOTS.STATUS, method: 'GET' }),
      providesTags: ['SiteBots'],
    }),
    createSiteBot: builder.mutation<
      AdminSiteBot,
      { name: string; avatarUrl?: string; active?: boolean }
    >({
      query: (body) => ({ url: SITE_BOTS.ROOT, method: 'POST', body }),
      invalidatesTags: ['SiteBots'],
    }),
    generateSiteBots: builder.mutation<
      { created: number; total: number },
      { count?: number } | void
    >({
      query: (body) => ({
        url: SITE_BOTS.GENERATE,
        method: 'POST',
        body: body ?? {},
      }),
      invalidatesTags: ['SiteBots'],
    }),
    updateSiteBot: builder.mutation<
      AdminSiteBot,
      { id: string; body: Partial<Pick<AdminSiteBot, 'name' | 'avatarUrl' | 'active'>> }
    >({
      query: ({ id, body }) => ({
        url: SITE_BOTS.BY_ID(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['SiteBots'],
    }),
    deleteSiteBot: builder.mutation<{ ok: boolean; avatarUrl?: string }, string>({
      query: (id) => ({ url: SITE_BOTS.BY_ID(id), method: 'DELETE' }),
      invalidatesTags: ['SiteBots'],
    }),
    bulkDeleteSiteBots: builder.mutation<
      { deleted: number; avatarUrls: string[] },
      { ids: string[] }
    >({
      query: (body) => ({
        url: SITE_BOTS.BULK_DELETE,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SiteBots'],
    }),
    bulkImportSiteBotNames: builder.mutation<
      SiteBotNameImportResult,
      { names: string[] }
    >({
      query: (body) => ({
        url: SITE_BOTS.BULK_IMPORT_NAMES,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SiteBots'],
    }),
    bulkRenameSiteBots: builder.mutation<
      SiteBotNameRenameResult,
      { items: Array<{ id: string; name: string }> }
    >({
      query: (body) => ({
        url: SITE_BOTS.BULK_RENAME,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SiteBots'],
    }),
    assignSiteBotAvatars: builder.mutation<
      {
        updated: number
        attempted: number
        leftoverFiles: number
        leftoverBots: number
        errors: string[]
      },
      FormData
    >({
      query: (body) => ({
        url: SITE_BOTS.AVATARS,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SiteBots'],
    }),
  }),
})

export const {
  useGetSiteBotsQuery,
  useGetSiteBotsStatusQuery,
  useCreateSiteBotMutation,
  useGenerateSiteBotsMutation,
  useUpdateSiteBotMutation,
  useDeleteSiteBotMutation,
  useBulkDeleteSiteBotsMutation,
  useBulkImportSiteBotNamesMutation,
  useBulkRenameSiteBotsMutation,
  useAssignSiteBotAvatarsMutation,
} = siteBotsApi
