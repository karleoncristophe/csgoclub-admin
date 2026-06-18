import { useEffect, useId } from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'

export type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'primary' | 'danger'
  warning?: string
  subjectLabel?: string
  subjectName?: string
  confirmDisabled?: boolean
  isLoading?: boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmVariant = 'primary',
  warning,
  subjectLabel,
  subjectName,
  confirmDisabled = false,
  isLoading = false,
}: ConfirmModalProps) {
  const titleId = useId()
  const isDanger = confirmVariant === 'danger'

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className={surfaceClass('modalBackdrop')}
        aria-label="Fechar"
        onClick={onClose}
      />
      <Surface
        variant="modalShell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-w-lg"
      >
        <div className={surfaceClass('modalHeaderRow')}>
          <ThemeText as="h2" id={titleId} tone="primary" className="text-lg font-semibold">
            {title}
          </ThemeText>
        </div>

        <div className="space-y-5 px-5 py-5">
          {subjectName ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                {subjectLabel ?? 'Item'}
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {subjectName}
              </p>
            </div>
          ) : null}

          <ThemeText as="p" tone="secondary" className="text-sm leading-relaxed">
            {description}
          </ThemeText>

          {warning ? (
            <div
              className={
                isDanger
                  ? 'flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/35 dark:text-red-300'
                  : 'flex gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900 dark:border-brand-900/50 dark:bg-brand-950/40 dark:text-brand-200'
              }
            >
              {isDanger ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              )}
              <p>{warning}</p>
            </div>
          ) : null}
        </div>

        <div className={surfaceClass('modalFooterRow')}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={confirmDisabled || isLoading}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </Surface>
    </div>
  )
}
