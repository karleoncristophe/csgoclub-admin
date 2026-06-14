import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'

export type FieldHelpModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}

export function FieldHelpModal({ open, onOpenChange, title, children }: FieldHelpModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
        aria-labelledby="field-help-title"
        className="max-h-[min(85vh,640px)] w-full max-w-lg overflow-hidden"
      >
        <Surface variant="modalHeaderRow">
          <ThemeText
            as="h2"
            id="field-help-title"
            tone="primary"
            className="pr-8 text-lg font-semibold"
          >
            {title}
          </ThemeText>
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
        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
          <ThemeText as="div" tone="secondary" className="space-y-3 text-sm leading-relaxed">
            {children}
          </ThemeText>
        </div>
        <div className="flex justify-end border-t border-zinc-200 px-5 py-3 dark:border-zinc-800">
          <Button type="button" variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Entendi
          </Button>
        </div>
      </Surface>
    </div>
  )
}
