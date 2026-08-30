import { Tabs as HeroTabs } from '@heroui/react'

export interface TabItem {
  id: string
  label: string
}

export interface TabsProps {
  tabs: TabItem[]
  activeId: string
  onChange: (id: string) => void
  className?: string
  ariaLabel?: string
}

/**
 * Tabs de seção (underline) — preferir SegmentedTabs para filtros em pill.
 * Usa o mesmo padrão pill do HeroUI para evitar o Indicator estourar a largura.
 */
export function Tabs({
  tabs,
  activeId,
  onChange,
  className = '',
  ariaLabel = 'Seções',
}: TabsProps) {
  return (
    <HeroTabs
      selectedKey={activeId}
      onSelectionChange={(key) => key != null && onChange(String(key))}
      className={`min-w-0 ${className}`}
    >
      <HeroTabs.ListContainer className="max-w-full">
        <HeroTabs.List aria-label={ariaLabel}>
          {tabs.map((tab) => (
            <HeroTabs.Tab
              key={tab.id}
              id={tab.id}
              className="!w-auto shrink-0 whitespace-nowrap"
            >
              {tab.label}
              <HeroTabs.Indicator />
            </HeroTabs.Tab>
          ))}
        </HeroTabs.List>
      </HeroTabs.ListContainer>
    </HeroTabs>
  )
}
