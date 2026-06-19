import { configureStore } from '@reduxjs/toolkit'
import { authApi } from '@/redux/store/api/auth/api.auth'
import { casesApi } from '@/redux/store/api/cases/api.cases'
import { metricsApi } from '@/redux/store/api/metrics/api.metrics'
import { skinsApi } from '@/redux/store/api/skins/api.skins'
import { usersApi } from '@/redux/store/api/users/api.users'
import { weaponCategoriesApi } from '@/redux/store/api/weapon-categories/api.weapon-categories'
import meReducer from '@/redux/store/slices/meSlice'
import securityReducer from '@/redux/store/slices/securitySlice'

export const store = configureStore({
  reducer: {
    security: securityReducer,
    me: meReducer,
    [authApi.reducerPath]: authApi.reducer,
    [skinsApi.reducerPath]: skinsApi.reducer,
    [casesApi.reducerPath]: casesApi.reducer,
    [metricsApi.reducerPath]: metricsApi.reducer,
    [usersApi.reducerPath]: usersApi.reducer,
    [weaponCategoriesApi.reducerPath]: weaponCategoriesApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      skinsApi.middleware,
      casesApi.middleware,
      metricsApi.middleware,
      usersApi.middleware,
      weaponCategoriesApi.middleware,
    ),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
