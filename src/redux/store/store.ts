import { configureStore } from '@reduxjs/toolkit'
import { aiAssistantApi } from '@/redux/store/api/ai/api.ai'
import { authApi } from '@/redux/store/api/auth/api.auth'
import { adminAccountsApi } from '@/redux/store/api/admins/api.admins'
import { arenaApi } from '@/redux/store/api/arena/api.arena'
import { battlesAdminApi } from '@/redux/store/api/battles/api.battles'
import { siteBotsApi } from '@/redux/store/api/site-bots/api.site-bots'
import { paymentApi } from '@/redux/store/api/payment/api.payment'
import { casesApi } from '@/redux/store/api/cases/api.cases'
import { caseOpensApi } from '@/redux/store/api/case-opens/api.case-opens'
import { tradesApi } from '@/redux/store/api/trades/api.trades'
import { swapsApi } from '@/redux/store/api/swaps/api.swaps'
import { swapTaxesApi } from '@/redux/store/api/swap-taxes/api.swap-taxes'
import { bannersApi } from '@/redux/store/api/banners/api.banners'
import { caseVitrinesApi } from '@/redux/store/api/case-vitrines/api.case-vitrines'
import { couponsApi } from '@/redux/store/api/coupons/api.coupons'
import { metricsApi } from '@/redux/store/api/metrics/api.metrics'
import { skinsApi } from '@/redux/store/api/skins/api.skins'
import { usersApi } from '@/redux/store/api/users/api.users'
import { gameplayApi } from '@/redux/store/api/gameplay/api.gameplay'
import { upgradesAdminApi } from '@/redux/store/api/upgrades/api.upgrades'
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
    [adminAccountsApi.reducerPath]: adminAccountsApi.reducer,
    [skinsApi.reducerPath]: skinsApi.reducer,
    [casesApi.reducerPath]: casesApi.reducer,
    [caseOpensApi.reducerPath]: caseOpensApi.reducer,
    [tradesApi.reducerPath]: tradesApi.reducer,
    [swapsApi.reducerPath]: swapsApi.reducer,
    [caseVitrinesApi.reducerPath]: caseVitrinesApi.reducer,
    [bannersApi.reducerPath]: bannersApi.reducer,
    [couponsApi.reducerPath]: couponsApi.reducer,
    [battlesAdminApi.reducerPath]: battlesAdminApi.reducer,
    [siteBotsApi.reducerPath]: siteBotsApi.reducer,
    [arenaApi.reducerPath]: arenaApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [metricsApi.reducerPath]: metricsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [upgradesAdminApi.reducerPath]: upgradesAdminApi.reducer,
    [gameplayApi.reducerPath]: gameplayApi.reducer,
    [weaponCategoriesApi.reducerPath]: weaponCategoriesApi.reducer,
    [swapTaxesApi.reducerPath]: swapTaxesApi.reducer,
    [aiAssistantApi.reducerPath]: aiAssistantApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      adminAccountsApi.middleware,
      skinsApi.middleware,
      casesApi.middleware,
      caseOpensApi.middleware,
      tradesApi.middleware,
      swapsApi.middleware,
      caseVitrinesApi.middleware,
      bannersApi.middleware,
      couponsApi.middleware,
      battlesAdminApi.middleware,
      siteBotsApi.middleware,
      arenaApi.middleware,
      paymentApi.middleware,
      metricsApi.middleware,
      usersApi.middleware,
      upgradesAdminApi.middleware,
      gameplayApi.middleware,
      weaponCategoriesApi.middleware,
      swapTaxesApi.middleware,
      aiAssistantApi.middleware,
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
