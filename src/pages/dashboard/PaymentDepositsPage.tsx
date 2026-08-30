import { PageTitle } from '@/components/ui/Title'
import { PaymentDepositsPanel } from '@/pages/dashboard/PaymentDepositsPanel'

export default function PaymentDepositsPage() {
  return (
    <div className="space-y-6">
      <PageTitle subtitle="Histórico de Pix e cripto. Se o webhook não chegar e o jogador comprovar, consulte a gateway ou aprove com o comprovante.">
        Depósitos
      </PageTitle>
      <PaymentDepositsPanel />
    </div>
  )
}
