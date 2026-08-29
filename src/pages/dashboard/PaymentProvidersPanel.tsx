import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Surface } from '@/components/ui/Surface'
import { Switch } from '@/components/ui/Switch'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  useGetPaymentProvidersQuery,
  useUpsertPaymentProviderMutation,
  type PaymentProviderCredential,
} from '@/redux/store/api/payment/api.payment'
import { getErrorMessage } from '@/utils/getErrorMessage'

function formatWhen(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

function XgateProviderCard({ item }: { item: PaymentProviderCredential }) {
  const [save, saveState] = useUpsertPaymentProviderMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [active, setActive] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    setEmail('')
    setPassword('')
    setApiBaseUrl(item.xgate?.apiBaseUrl ?? 'https://api.xgateglobal.com')
    setActive(item.status === 'ACTIVE')
  }, [item])

  const handleSave = async () => {
    setFormError(null)
    try {
      await save({
        provider: item.provider,
        body: {
          status: active ? 'ACTIVE' : 'INACTIVE',
          xgate: {
            email: email.trim() || undefined,
            password: password.trim() || undefined,
            apiBaseUrl: apiBaseUrl.trim() || undefined,
          },
        },
      }).unwrap()
      setPassword('')
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <ThemeText as="p" tone="primary" className="font-semibold">
            {item.catalog.label}
          </ThemeText>
          <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
            {item.catalog.description}
          </ThemeText>
        </div>
        <ThemeText as="p" tone="secondary" className="text-xs">
          Webhook: {item.webhookPath}
        </ThemeText>
      </div>

      {formError ? (
        <Surface variant="errorBanner" className="mb-4">
          {formError}
        </Surface>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          autoComplete="off"
          label="Email"
          name={`xgate-email-${item.provider}`}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={item.xgate?.emailMasked ?? 'email@empresa.com'}
          type="email"
          value={email}
        />
        <Input
          autoComplete="new-password"
          description={
            item.xgate?.hasPassword
              ? 'Deixe em branco para manter a senha já salva.'
              : 'Senha da conta XGate. Guardada criptografada.'
          }
          label="Senha"
          name={`xgate-password-${item.provider}`}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={item.xgate?.hasPassword ? item.xgate.passwordMasked : '••••••••'}
          type="password"
          value={password}
        />
        <Input
          label="URL da API"
          name={`xgate-url-${item.provider}`}
          onChange={(event) => setApiBaseUrl(event.target.value)}
          value={apiBaseUrl}
        />
        <Switch
          checked={active}
          description="Se inativa, o depósito em cripto some do site."
          label="Ativa"
          onChange={setActive}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ThemeText as="p" tone="secondary" className="text-xs">
          {item.configured ? 'Chaves cadastradas' : 'Sem chaves ainda'}
          {item.updatedAt ? ` · ${formatWhen(item.updatedAt)}` : ''}
        </ThemeText>
        <Button
          disabled={saveState.isLoading}
          isLoading={saveState.isLoading}
          onClick={() => void handleSave()}
          type="button"
        >
          Salvar chaves
        </Button>
      </div>
    </div>
  )
}

export function PaymentProvidersPanel() {
  const { data, isLoading, isError, error } = useGetPaymentProvidersQuery()

  return (
    <Surface variant="card" className="!p-6">
      <div className="mb-4">
        <ThemeText as="h2" tone="primary" className="text-base font-semibold">
          APIs de pagamento
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
          Chaves ficam criptografadas (nunca em texto puro). Por ora só cripto via
          XGate. Outras APIs entram aqui depois, cada uma com o próprio câmbio.
        </ThemeText>
      </div>

      {isLoading ? (
        <ThemeText tone="secondary" className="text-sm">
          Carregando APIs de pagamento...
        </ThemeText>
      ) : null}

      {isError ? (
        <Surface variant="errorBanner">{getErrorMessage(error)}</Surface>
      ) : null}

      <div className="space-y-4">
        {(data ?? []).map((item) => (
          <XgateProviderCard item={item} key={item.provider} />
        ))}
      </div>
    </Surface>
  )
}
