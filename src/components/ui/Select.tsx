import {
  Children,
  isValidElement,
  type ChangeEvent,
  type ReactNode,
  type SelectHTMLAttributes,
  useId,
} from 'react'
import {
  Description,
  Label,
  ListBox,
  ListBoxItem,
  Select as HeroSelect,
} from '@heroui/react'
import type { FieldHelp } from '@/components/ui/fieldHelp'
import { FieldHelpButton } from '@/components/ui/FieldHelpButton'

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string
  hint?: string
  description?: string
  fieldHelp?: FieldHelp
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
}

/** React Aria rejeita key vazia; mapeamos a opção em branco para um sentinel. */
const EMPTY_SELECT_KEY = '__empty__'

function toSelectKey(value: string | number | readonly string[]): string {
  const next = String(value)
  return next === '' ? EMPTY_SELECT_KEY : next
}

function fromSelectKey(key: string): string {
  return key === EMPTY_SELECT_KEY ? '' : key
}

function optionItems(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: ReactNode }>(child)) {
      return []
    }
    if (child.type === 'option') {
      const value = toSelectKey(child.props.value ?? String(child.props.children ?? ''))
      const label = child.props.children
      return (
        <ListBoxItem
          key={value}
          id={value}
          textValue={typeof label === 'string' ? label : value}
          isDisabled={child.props.disabled}
        >
          {label}
        </ListBoxItem>
      )
    }
    if (child.type === 'optgroup') return optionItems(child.props.children)
    return []
  })
}

/** API de select nativo preservada sobre Select/ListBox do HeroUI. */
export function Select({
  label,
  hint,
  description,
  fieldHelp,
  id,
  className,
  children,
  value,
  defaultValue,
  name,
  disabled,
  required,
  onChange,
  ...rest
}: SelectProps) {
  const uid = useId()
  const selectId = id ?? `${name ?? 'select'}-${uid}`
  const selectedKey = value === undefined ? undefined : toSelectKey(value)
  const defaultSelectedKey =
    defaultValue === undefined ? undefined : toSelectKey(defaultValue)

  return (
    <HeroSelect
      {...(rest as Record<string, unknown>)}
      name={name}
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey}
      isDisabled={disabled}
      isRequired={required}
      onSelectionChange={(key) => {
        if (key == null) return
        const nextValue = fromSelectKey(String(key))
        onChange?.({
          target: { value: nextValue, name: name ?? '' },
          currentTarget: { value: nextValue, name: name ?? '' },
        } as ChangeEvent<HTMLSelectElement>)
      }}
      className="w-full"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        <Label htmlFor={selectId}>{label}</Label>
        {fieldHelp ? <FieldHelpButton fieldHelp={fieldHelp} /> : null}
      </div>
      <HeroSelect.Trigger id={selectId} className={className}>
        <HeroSelect.Value />
        <HeroSelect.Indicator />
      </HeroSelect.Trigger>
      <HeroSelect.Popover className="select__popover">
        <ListBox>{optionItems(children)}</ListBox>
      </HeroSelect.Popover>
      {description ? <Description>{description}</Description> : null}
      {hint ? <Description>{hint}</Description> : null}
    </HeroSelect>
  )
}
