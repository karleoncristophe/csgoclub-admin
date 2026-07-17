import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  loadStoredPlatformDataEnvironment,
  saveStoredPlatformDataEnvironment,
  type PlatformDataEnvironment,
} from '@/utils/platformDataEnvironmentStorage'

type PlatformDataEnvironmentState = {
  value: PlatformDataEnvironment
}

const initialState: PlatformDataEnvironmentState = {
  value: loadStoredPlatformDataEnvironment(),
}

const platformDataEnvironmentSlice = createSlice({
  name: 'platformDataEnvironment',
  initialState,
  reducers: {
    setPlatformDataEnvironment(
      state,
      action: PayloadAction<PlatformDataEnvironment>,
    ) {
      state.value = action.payload
      saveStoredPlatformDataEnvironment(action.payload)
    },
    togglePlatformDataEnvironment(state) {
      const next = state.value === 'PRODUCTION' ? 'SANDBOX' : 'PRODUCTION'
      state.value = next
      saveStoredPlatformDataEnvironment(next)
    },
  },
})

export const { setPlatformDataEnvironment, togglePlatformDataEnvironment } =
  platformDataEnvironmentSlice.actions
export default platformDataEnvironmentSlice.reducer
