import { useSelector } from 'react-redux'
import type { RootState } from '@/redux/store/store'
import type { PlatformDataEnvironment } from '@/utils/platformDataEnvironmentStorage'

export function usePlatformDataEnvironment(): PlatformDataEnvironment {
  return useSelector((state: RootState) => state.platformDataEnvironment.value)
}

export function useIsSandboxDataEnvironment(): boolean {
  return usePlatformDataEnvironment() === 'SANDBOX'
}
