import { type InputHTMLAttributes, type ReactNode, useId } from 'react'
import {
  Description,
  FieldError,
  Input as HeroInput,
  InputGroup,
  Label,
  TextField,
} from '@heroui/react'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  description?: string
  fieldHelp?: FieldHelp
  endAdornment?: ReactNode
}

/** API existente do admin, renderizada pelos campos acessíveis do HeroUI. */
export function Input({
  label,
  error,
  hint,
  description,
  fieldHelp,
  id,
  className,
  endAdornment,
  type,
  onFocus,
  ...rest
}: InputProps) {
  const uid = useId()
  const inputId = id ?? `${rest.name ?? 'field'}-${uid}`
  const handleFocus: InputHTMLAttributes<HTMLInputElement>['onFocus'] = (event) => {
    if (type === 'number') event.currentTarget.select()
    onFocus?.(event)
  }
  const inputProps = {
    id: inputId,
    type,
    className,
    onFocus: handleFocus,
    ...rest,
  } as Record<string, unknown>

  return (
    <TextField isInvalid={Boolean(error)} className="w-full">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Label htmlFor={inputId}>{label}</Label>
        {fieldHelp ? <FieldHelpButton fieldHelp={fieldHelp} /> : null}
      </div>
      {endAdornment ? (
        <InputGroup fullWidth>
          <InputGroup.Input {...inputProps} />
          <InputGroup.Suffix>{endAdornment}</InputGroup.Suffix>
        </InputGroup>
      ) : (
        <HeroInput fullWidth {...inputProps} />
      )}
      {description && !error ? <Description>{description}</Description> : null}
      {hint && !error ? <Description>{hint}</Description> : null}
      {error ? <FieldError>{error}</FieldError> : null}
    </TextField>
  )
}
