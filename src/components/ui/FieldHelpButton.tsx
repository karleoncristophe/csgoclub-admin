import { useState } from 'react'
import { CircleHelp } from 'lucide-react'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpModal } from '@/components/ui/FieldHelpModal'

type FieldHelpButtonProps = {
  fieldHelp: FieldHelp
  className?: string
}

export function FieldHelpButton({ fieldHelp, className = '' }: FieldHelpButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent focus:outline-none focus:ring-2 focus:ring-focus/30 ${className}`}
        aria-label={`Ajuda: ${fieldHelp.title}`}
        onClick={() => setOpen(true)}
      >
        <CircleHelp className="h-4 w-4" strokeWidth={2} />
      </button>
      <FieldHelpModal open={open} onOpenChange={setOpen} title={fieldHelp.title}>
        {fieldHelp.content}
      </FieldHelpModal>
    </>
  )
}
