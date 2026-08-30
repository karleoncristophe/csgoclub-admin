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

/** API compacta do admin sobre as tabs acessíveis do HeroUI. */
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
      className={className}
    >
      <HeroTabs.ListContainer className="border-b border-separator">
        <HeroTabs.List aria-label={ariaLabel} className="gap-1">
          {tabs.map((tab) => (
            <HeroTabs.Tab
              key={tab.id}
              id={tab.id}
              className="min-h-9 px-3 text-sm font-medium text-muted data-[selected=true]:text-accent"
            >
              {tab.label}
              <HeroTabs.Indicator className="bg-accent" />
            </HeroTabs.Tab>
          ))}
        </HeroTabs.List>
      </HeroTabs.ListContainer>
    </HeroTabs>
  )
}
