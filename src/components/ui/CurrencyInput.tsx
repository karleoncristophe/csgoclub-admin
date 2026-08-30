import { useEffect, useState } from 'react'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import { Input } from '@/components/ui/Input'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import {
  formatCurrencyAmountInput,
  formatCurrencyInput,
  parseCurrencyInputToAmount,
} from '@/utils/skinsCurrencyInput'

type CurrencyInputProps = {
  label: string
  name: string
  value: number
  currency: SkinsCurrency
  onChange: (amount: number) => void
  onBlur?: () => void
  error?: string
  hint?: string
  description?: string
  fieldHelp?: FieldHelp
  disabled?: boolean
}

export function CurrencyInput({
  label,
  name,
  value,
  currency,
  onChange,
  onBlur,
  error,
  hint,
  description,
  fieldHelp,
  disabled = false,
}: CurrencyInputProps) {
  const [display, setDisplay] = useState(() => formatCurrencyAmountInput(value, currency))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      // Mantém a máscara local sincronizada quando moeda ou valor externo mudam.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplay(formatCurrencyAmountInput(value, currency))
    }
  }, [value, currency, focused])

  return (
    <Input
      label={label}
      name={name}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      disabled={disabled}
      placeholder={formatCurrencyAmountInput(0, currency)}
      value={display}
      error={error}
      hint={hint}
      description={description}
      fieldHelp={fieldHelp}
      onChange={(event) => {
        const masked = formatCurrencyInput(event.target.value, currency)
        setDisplay(masked)
        onChange(parseCurrencyInputToAmount(masked))
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        onBlur?.()
      }}
    />
  )
}
