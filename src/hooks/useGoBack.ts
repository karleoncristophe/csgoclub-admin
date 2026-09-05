import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { pathWithStoredFilters } from '@/utils/listFilterStorage'

export function useGoBack(fallbackPath: string) {
  const navigate = useNavigate()

  return useCallback(() => {
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) {
      navigate(-1)
      return
    }
    navigate(pathWithStoredFilters(fallbackPath))
  }, [fallbackPath, navigate])
}
