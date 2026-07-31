import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'

const sizeClass = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-6xl',
} as const

export type ModalSize = keyof typeof sizeClass

export type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  size?: ModalSize
  footer?: ReactNode
  children: ReactNode
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  size = 'lg',
  footer,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className={surfaceClass('modalBackdrop')}
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
      />
      <Surface
        variant="modalShell"
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[min(90vh,900px)] w-full flex-col ${sizeClass[size]}`}
      >
        <Surface variant="modalHeaderRow" className="relative shrink-0">
          <div className="min-w-0 pr-10">
            <ThemeText as="h2" tone="primary" className="text-lg font-semibold">
              {title}
            </ThemeText>
            {description ? (
              <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                {description}
              </ThemeText>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-3 top-3 h-8 w-8 p-0"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </Button>
        </Surface>

        <div className="scrollbar-list min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer ? (
          <Surface variant="modalFooterRow" className="shrink-0 justify-end">
            {footer}
          </Surface>
        ) : null}
      </Surface>
    </div>
  )
}
