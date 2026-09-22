import { PageTitle } from '@/components/ui/Title'
import { SiteBotsPanel } from './bots/SiteBotsPanel'

export default function BotsAdminPage() {
  return (
    <div className="space-y-6">
      <PageTitle subtitle="Crie ou atualize nicks em escala. Fotos casam com o nome do arquivo.">
        Bots
      </PageTitle>
      <SiteBotsPanel />
    </div>
  )
}
