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

function optionItems(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; disabled?: boolean; children?: ReactNode }>(child)) {
      return []
    }
    if (child.type === 'option') {
      const value = child.props.value ?? String(child.props.children ?? '')
      return (
        <ListBoxItem key={value} id={value} isDisabled={child.props.disabled}>
          {child.props.children}
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
  const selectedKey = value === undefined ? undefined : String(value)
  const defaultSelectedKey = defaultValue === undefined ? undefined : String(defaultValue)

  return (
    <HeroSelect
      name={name}
      selectedKey={selectedKey}
      defaultSelectedKey={defaultSelectedKey}
      isDisabled={disabled}
      isRequired={required}
      onSelectionChange={(key) => {
        const nextValue = String(key ?? '')
        onChange?.({
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        } as ChangeEvent<HTMLSelectElement>)
      }}
      className="w-full"
      {...(rest as Record<string, unknown>)}
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
