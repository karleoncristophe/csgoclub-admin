import { Tabs as HeroTabs } from '@heroui/react'
import type { ReactNode } from 'react'

export type SegmentedTabItem = {
  id: string
  label: ReactNode
  textValue?: string
  disabled?: boolean
}

type SegmentedTabsProps = {
  items: SegmentedTabItem[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

/** Filtro de uma escolha, compacto e rolável em telas estreitas. */
export function SegmentedTabs({
  items,
  value,
  onChange,
  ariaLabel,
  className = '',
}: SegmentedTabsProps) {
  return (
    <HeroTabs
      variant="secondary"
      selectedKey={value}
      onSelectionChange={(key) => key != null && onChange(String(key))}
      className={`min-w-0 ${className}`}
    >
      <HeroTabs.ListContainer className="max-w-full overflow-x-auto rounded-xl bg-default p-1 scrollbar-list">
        <HeroTabs.List aria-label={ariaLabel} className="w-max min-w-full gap-1">
          {items.map((item) => (
            <HeroTabs.Tab
              key={item.id}
              id={item.id}
              textValue={item.textValue}
              isDisabled={item.disabled}
              className="min-h-8 whitespace-nowrap rounded-lg px-3 text-xs font-medium text-muted data-[selected=true]:bg-surface data-[selected=true]:text-foreground data-[selected=true]:shadow-sm"
            >
              {item.label}
              <HeroTabs.Indicator className="rounded-lg bg-surface shadow-sm" />
            </HeroTabs.Tab>
          ))}
        </HeroTabs.List>
      </HeroTabs.ListContainer>
    </HeroTabs>
  )
}
