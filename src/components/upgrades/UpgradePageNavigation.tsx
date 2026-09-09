import { NavLink } from 'react-router-dom'
import { BarChart3, ListTree } from 'lucide-react'

const ITEMS = [
  { to: '/dashboard/upgrades', label: 'Visão financeira', Icon: BarChart3, end: true },
  { to: '/dashboard/upgrades/results', label: 'Detalhamento', Icon: ListTree, end: false },
]

export function UpgradePageNavigation() {
  return (
    <nav
      aria-label="Seções do Upgrade"
      className="mb-6 inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface-secondary p-1"
    >
      {ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-muted hover:bg-default hover:text-foreground'
            }`
          }
        >
          <Icon className="h-4 w-4" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
