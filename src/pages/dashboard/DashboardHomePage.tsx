import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <PageTitle subtitle="Em breve vamos exibir métricas principais aqui.">
        Dashboard
      </PageTitle>

      <Surface variant="card">
        <ThemeText as="p" tone="secondary" className="text-sm">
          Tela reservada para métricas.
        </ThemeText>
      </Surface>
    </div>
  )
}
