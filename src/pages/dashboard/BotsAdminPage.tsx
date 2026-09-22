import { PageTitle } from '@/components/ui/Title'
import { SiteBotsPanel } from './bots/SiteBotsPanel'

export default function BotsAdminPage() {
  return (
    <div className="space-y-6">
      <PageTitle subtitle="Filtre e selecione quem editar. Nicks entram pela lista que você colar; fotos casam com o nome do arquivo.">
        Bots
      </PageTitle>
      <SiteBotsPanel />
    </div>
  )
}
