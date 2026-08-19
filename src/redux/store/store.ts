import { configureStore } from '@reduxjs/toolkit'
import { aiAssistantApi } from '@/redux/store/api/ai/api.ai'
import { authApi } from '@/redux/store/api/auth/api.auth'
import { battlesAdminApi } from '@/redux/store/api/battles/api.battles'
import { casesApi } from '@/redux/store/api/cases/api.cases'
import { caseOpensApi } from '@/redux/store/api/case-opens/api.case-opens'
import { tradesApi } from '@/redux/store/api/trades/api.trades'
import { bannersApi } from '@/redux/store/api/banners/api.banners'
import { caseVitrinesApi } from '@/redux/store/api/case-vitrines/api.case-vitrines'
import { couponsApi } from '@/redux/store/api/coupons/api.coupons'
import { metricsApi } from '@/redux/store/api/metrics/api.metrics'
import { skinsApi } from '@/redux/store/api/skins/api.skins'
import { usersApi } from '@/redux/store/api/users/api.users'
import { weaponCategoriesApi } from '@/redux/store/api/weapon-categories/api.weapon-categories'
import meReducer from '@/redux/store/slices/meSlice'
import platformDataEnvironmentReducer from '@/redux/store/slices/platformDataEnvironmentSlice'
import securityReducer from '@/redux/store/slices/securitySlice'

export const store = configureStore({
  reducer: {
    security: securityReducer,
    me: meReducer,
    platformDataEnvironment: platformDataEnvironmentReducer,
    [authApi.reducerPath]: authApi.reducer,
    [skinsApi.reducerPath]: skinsApi.reducer,
    [casesApi.reducerPath]: casesApi.reducer,
    [caseOpensApi.reducerPath]: caseOpensApi.reducer,
    [tradesApi.reducerPath]: tradesApi.reducer,
    [caseVitrinesApi.reducerPath]: caseVitrinesApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [couponsApi.reducerPath]: couponsApi.reducer,
    [battlesAdminApi.reducerPath]: battlesAdminApi.reducer,
    [metricsApi.reducerPath]: metricsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [weaponCategoriesApi.reducerPath]: weaponCategoriesApi.reducer,
    [aiAssistantApi.reducerPath]: aiAssistantApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      skinsApi.middleware,
      casesApi.middleware,
      caseOpensApi.middleware,
      tradesApi.middleware,
      caseVitrinesApi.middleware,
      bannersApi.middleware,
      couponsApi.middleware,
      battlesAdminApi.middleware,
      metricsApi.middleware,
      usersApi.middleware,
      weaponCategoriesApi.middleware,
      aiAssistantApi.middleware,
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
