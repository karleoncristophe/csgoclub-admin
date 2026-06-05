import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

export interface AdminMe {
  _id?: string
  email?: string
  name?: string
  role?: string
}

export type MeState = AdminMe

const initialState: MeState = {}

export const meSlice = createSlice({
  name: 'me',
  initialState,
  reducers: {
    setMe: (state, { payload }: PayloadAction<AdminMe>) => {
      state._id = payload._id
      state.email = payload.email
      state.name = payload.name
      state.role = payload.role
    },
    removeMe: () => initialState,
  },
})

export const { setMe, removeMe } = meSlice.actions
export default meSlice.reducer
