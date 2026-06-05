import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'

export function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Algo deu errado. Tente novamente.'
  }

  const maybeFetch = error as FetchBaseQueryError
  if ('status' in maybeFetch && maybeFetch.data !== undefined) {
    const data = maybeFetch.data
    if (typeof data === 'string') return data
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const m = (data as { message: unknown }).message
      if (Array.isArray(m)) return m.map(String).join(', ')
      if (typeof m === 'string') return m
    }
  }

  if (
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  return 'Algo deu errado. Tente novamente.'
}
