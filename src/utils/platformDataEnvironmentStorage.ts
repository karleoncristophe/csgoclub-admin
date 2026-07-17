const STORAGE_KEY = 'cs2club-admin-data-environment'

export const ADMIN_DATA_ENVIRONMENT_HEADER = 'x-admin-data-environment'

export type PlatformDataEnvironment = 'PRODUCTION' | 'SANDBOX'

export function loadStoredPlatformDataEnvironment(): PlatformDataEnvironment {
  if (typeof window === 'undefined') return 'PRODUCTION'
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw === 'SANDBOX' ? 'SANDBOX' : 'PRODUCTION'
  } catch {
    return 'PRODUCTION'
  }
}

export function saveStoredPlatformDataEnvironment(value: PlatformDataEnvironment) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, value)
}

export function labelPlatformDataEnvironment(value: PlatformDataEnvironment) {
  return value === 'SANDBOX' ? 'Influencer' : 'Produção'
}

/** Incluído nos args RTK Query para isolar cache; o backend usa o header HTTP. */
export type WithPlatformDataEnvironment<T> = T & {
  dataEnvironment?: PlatformDataEnvironment
}

export function omitDataEnvironmentQueryArg<T extends { dataEnvironment?: PlatformDataEnvironment }>(
  args: T,
): Omit<T, 'dataEnvironment'> {
  const { dataEnvironment: _ignored, ...rest } = args
  return rest
}
