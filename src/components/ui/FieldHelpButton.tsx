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
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:hover:bg-zinc-800 dark:hover:text-brand-400 ${className}`}
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
