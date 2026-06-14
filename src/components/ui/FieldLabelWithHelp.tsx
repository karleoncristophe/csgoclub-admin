import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'

type FieldLabelWithHelpProps = {
  label: string
  fieldHelp?: FieldHelp
  className?: string
}

export function FieldLabelWithHelp({
  label,
  fieldHelp,
  className = '',
}: FieldLabelWithHelpProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span>{label}</span>
      {fieldHelp ? <FieldHelpButton fieldHelp={fieldHelp} /> : null}
    </div>
  )
}
