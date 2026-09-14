import { PageTitle } from '@/components/ui/Title'
import { SiteBotsPanel } from './bots/SiteBotsPanel'

export default function BotsAdminPage() {
  return (
    <div className="space-y-6">
      <PageTitle subtitle="O mesmo nick aparece no livedrop, no top drop e nas vagas de battle. A escolha é aleatória.">
        Bots
      </PageTitle>
      <SiteBotsPanel />
    </div>
  )
}
