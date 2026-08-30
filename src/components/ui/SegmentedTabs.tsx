import { Tabs as HeroTabs } from '@heroui/react'
import type { ReactNode } from 'react'

export type SegmentedTabItem = {
  id: string
  label: ReactNode
  disabled?: boolean
}

type SegmentedTabsProps = {
  items: SegmentedTabItem[]
  value: string
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}

/**
 * Filtro de uma escolha com HeroUI Tabs (variant primary / pill).
 * Rolável horizontalmente; chevrons nativos do ListContainer.
 */
export function SegmentedTabs({
  items,
  value,
  onChange,
  ariaLabel,
  className = '',
}: SegmentedTabsProps) {
  return (
    <HeroTabs
      selectedKey={value}
      onSelectionChange={(key) => {
        if (key != null) onChange(String(key))
      }}
      className={`min-w-0 ${className}`}
    >
      <HeroTabs.ListContainer className="max-w-full">
        <HeroTabs.List aria-label={ariaLabel} className="gap-1">
          {items.map((item) => (
            <HeroTabs.Tab
              key={item.id}
              id={item.id}
              isDisabled={item.disabled}
              className="!w-auto shrink-0 whitespace-nowrap"
            >
              {item.label}
              <HeroTabs.Indicator />
            </HeroTabs.Tab>
          ))}
        </HeroTabs.List>
      </HeroTabs.ListContainer>
    </HeroTabs>
  )
}
