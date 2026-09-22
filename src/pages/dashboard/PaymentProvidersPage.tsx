import { PageTitle } from '@/components/ui/Title'
import { PaymentProvidersPanel } from '@/pages/dashboard/PaymentProvidersPanel'

/**
 * Chaves das APIs de pagamento (Pix/cripto).
 * O câmbio não é configurável: toda conversão usa a cotação da SkinsBack,
 * a mesma do catálogo de skins.
 */
export default function PaymentProvidersPage() {
  return (
    <div className="space-y-6">
      <PageTitle subtitle="Chaves das APIs de pagamento. O histórico de Pix e cripto fica em Depósitos. Conversões de moeda usam sempre a cotação da SkinsBack.">
        APIs de pagamento
      </PageTitle>
      <PaymentProvidersPanel />
    </div>
  )
}
