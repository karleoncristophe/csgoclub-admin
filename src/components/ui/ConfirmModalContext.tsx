import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ConfirmModal, type ConfirmModalProps } from '@/components/ui/ConfirmModal'

export type ConfirmOptions = Omit<
  ConfirmModalProps,
  'open' | 'onClose' | 'onConfirm' | 'isLoading'
>

type ConfirmModalContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmModalContext = createContext<ConfirmModalContextValue | null>(null)

type ConfirmState = {
  open: boolean
  options: ConfirmOptions
  isLoading: boolean
}

const defaultOptions: ConfirmOptions = {
  title: '',
  description: '',
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const resolveRef = useRef<((value: boolean) => void) | null>(null)
  const [state, setState] = useState<ConfirmState>({
    open: false,
    options: defaultOptions,
    isLoading: false,
  })

  const close = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setState((current) => ({
      ...current,
      open: false,
      isLoading: false,
    }))
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
      setState({
        open: true,
        options,
        isLoading: false,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (state.options.confirmDisabled) return
    close(true)
  }, [close, state.options.confirmDisabled])

  const value = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmModalContext.Provider value={value}>
      {children}
      <ConfirmModal
        open={state.open}
        onClose={() => close(false)}
        onConfirm={handleConfirm}
        isLoading={state.isLoading}
        {...state.options}
      />
    </ConfirmModalContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmModalContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmModalProvider')
  }
  return context
}
