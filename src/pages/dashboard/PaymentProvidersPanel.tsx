import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { Switch } from '@/components/ui/Switch'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  useGetPaymentProvidersQuery,
  useUpsertPaymentProviderMutation,
  type PaymentProviderCredential,
  type PaymentProviderSecrets,
  type UpsertPaymentProviderBody,
} from '@/redux/store/api/payment/api.payment'
import { getErrorMessage } from '@/utils/getErrorMessage'

const WOOVI_PRODUCTION_API = 'https://api.woovi.com'
const WOOVI_SANDBOX_API = 'https://api.woovi-sandbox.com'

function wooviApiBaseUrl(value?: string) {
  if (value?.includes('woovi-sandbox') || value?.includes('openpix-sandbox')) {
    return WOOVI_SANDBOX_API
  }
  return WOOVI_PRODUCTION_API
}

function formatWhen(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

function nestedSecrets(item: PaymentProviderCredential): PaymentProviderSecrets {
  if (item.provider === 'woovi') return item.woovi ?? {}
  return item.xgate ?? {}
}

function fieldPlaceholder(item: PaymentProviderCredential, key: string): string | undefined {
  const secrets = nestedSecrets(item)
  if (key === 'email') return secrets.emailMasked ?? 'email@empresa.com'
  if (key === 'password') {
    return secrets.hasPassword ? secrets.passwordMasked : '••••••••'
  }
  if (key === 'appId') {
    return secrets.hasAppId ? secrets.appIdMasked : 'AppID da Woovi'
  }
  if (key === 'apiBaseUrl') return secrets.apiBaseUrl
  return undefined
}

function fieldDescription(item: PaymentProviderCredential, key: string): string | undefined {
  const secrets = nestedSecrets(item)
  if (key === 'password' && secrets.hasPassword) {
    return 'Deixe em branco para manter a senha já salva.'
  }
  if (key === 'password') {
    return 'Senha da conta. Guardada criptografada.'
  }
  if (key === 'appId' && secrets.hasAppId) {
    return 'Deixe em branco para manter o AppID já salvo.'
  }
  if (key === 'appId') {
    return 'AppID da API (header Authorization, sem Bearer). Guardado criptografado.'
  }
  if (key === 'apiBaseUrl' && item.provider === 'woovi') {
    return 'AppID de teste só funciona no sandbox. AppID de produção só em api.woovi.com.'
  }
  return undefined
}

function parseOptionalMoney(raw: string, label: string): number | null {
  const trimmed = raw.trim().replace(',', '.')
  if (!trimmed) return null
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} precisa ser um número maior ou igual a 0.`)
  }
  return value
}

function ProviderCard({ item }: { item: PaymentProviderCredential }) {
  const [save, saveState] = useUpsertPaymentProviderMutation()
  const [fields, setFields] = useState<Record<string, string>>({})
  const [cashbackPercent, setCashbackPercent] = useState('0')
  const [cashbackMaxUsd, setCashbackMaxUsd] = useState('')
  const [cashbackMaxBrl, setCashbackMaxBrl] = useState('')
  const [cashbackMaxEur, setCashbackMaxEur] = useState('')
  const [active, setActive] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const secrets = nestedSecrets(item)
    const next: Record<string, string> = {}
    for (const field of item.catalog.fields) {
      if (field.key === 'apiBaseUrl' && item.provider === 'woovi') {
        next[field.key] = wooviApiBaseUrl(secrets.apiBaseUrl)
      } else if (field.type === 'url') {
        next[field.key] = String(secrets.apiBaseUrl ?? '')
      } else {
        next[field.key] = ''
      }
    }
    setFields(next)
    setCashbackPercent(String(item.cashbackPercent ?? 0))
    setCashbackMaxUsd(item.cashbackMaxUsd != null ? String(item.cashbackMaxUsd) : '')
    setCashbackMaxBrl(item.cashbackMaxBrl != null ? String(item.cashbackMaxBrl) : '')
    setCashbackMaxEur(item.cashbackMaxEur != null ? String(item.cashbackMaxEur) : '')
    setActive(item.status === 'ACTIVE')
  }, [item])

  const handleSave = async () => {
    setFormError(null)
    const parsedCashback = Number(cashbackPercent.replace(',', '.'))
    if (!Number.isFinite(parsedCashback) || parsedCashback < 0 || parsedCashback > 100) {
      setFormError('Cashback precisa ser um número entre 0 e 100.')
      return
    }
    try {
      const config: Record<string, string | undefined> = {}
      for (const field of item.catalog.fields) {
        const value = fields[field.key]?.trim()
        config[field.key] = value || undefined
      }
      const body: UpsertPaymentProviderBody = {
        status: active ? 'ACTIVE' : 'INACTIVE',
        cashbackPercent: parsedCashback,
        cashbackMaxUsd: parseOptionalMoney(cashbackMaxUsd, 'Teto USD'),
        cashbackMaxBrl: parseOptionalMoney(cashbackMaxBrl, 'Teto BRL'),
        cashbackMaxEur: parseOptionalMoney(cashbackMaxEur, 'Teto EUR'),
      }
      if (item.provider === 'woovi') {
        body.woovi = {
          appId: config.appId,
          apiBaseUrl: config.apiBaseUrl,
        }
      } else {
        body.xgate = {
          email: config.email,
          password: config.password,
          apiBaseUrl: config.apiBaseUrl,
        }
      }
      await save({
        provider: item.provider,
        body,
      }).unwrap()
      setFields((current) => {
        const cleared = { ...current }
        for (const field of item.catalog.fields) {
          if (field.type === 'password') cleared[field.key] = ''
        }
        return cleared
      })
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const isPix = item.catalog.methods.includes('pix')

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
        {item.catalog.fields.map((field) =>
          field.key === 'apiBaseUrl' && item.provider === 'woovi' ? (
            <Select
              description={fieldDescription(item, field.key)}
              key={field.key}
              label="Ambiente"
              name={`${item.provider}-${field.key}`}
              onChange={(event) =>
                setFields((current) => ({ ...current, [field.key]: event.target.value }))
              }
              value={wooviApiBaseUrl(fields[field.key])}
            >
              <option value={WOOVI_PRODUCTION_API}>Produção (api.woovi.com)</option>
              <option value={WOOVI_SANDBOX_API}>Teste / sandbox (api.woovi-sandbox.com)</option>
            </Select>
          ) : (
            <Input
              autoComplete={field.type === 'password' ? 'new-password' : 'off'}
              description={fieldDescription(item, field.key)}
              key={field.key}
              label={field.label}
              name={`${item.provider}-${field.key}`}
              onChange={(event) =>
                setFields((current) => ({ ...current, [field.key]: event.target.value }))
              }
              placeholder={fieldPlaceholder(item, field.key)}
              type={field.type === 'url' ? 'url' : field.type}
              value={fields[field.key] ?? ''}
            />
          ),
        )}
        <Input
          description="Percentual creditado a mais sobre cada depósito pago (ex.: 2 = +2%)."
          label="Cashback no depósito (%)"
          name={`${item.provider}-cashback`}
          onChange={(event) => setCashbackPercent(event.target.value)}
          type="number"
          value={cashbackPercent}
        />
        <Input
          description="Teto do cashback quando a carteira do jogador está em USD. Vazio = sem teto."
          label="Teto de cashback (USD)"
          name={`${item.provider}-cashback-max-usd`}
          onChange={(event) => setCashbackMaxUsd(event.target.value)}
          placeholder="Ex.: 10"
          type="number"
          value={cashbackMaxUsd}
        />
        <Input
          description="Teto do cashback quando a carteira está em BRL. Vazio = sem teto."
          label="Teto de cashback (BRL)"
          name={`${item.provider}-cashback-max-brl`}
          onChange={(event) => setCashbackMaxBrl(event.target.value)}
          placeholder="Ex.: 10"
          type="number"
          value={cashbackMaxBrl}
        />
        <Input
          description="Teto do cashback quando a carteira está em EUR. Vazio = sem teto."
          label="Teto de cashback (EUR)"
          name={`${item.provider}-cashback-max-eur`}
          onChange={(event) => setCashbackMaxEur(event.target.value)}
          placeholder="Ex.: 5"
          type="number"
          value={cashbackMaxEur}
        />
        <Switch
          checked={active}
          description={
            isPix
              ? 'Se inativa, o Pix some do site.'
              : 'Se inativa, o depósito em cripto some do site.'
          }
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
          Salvar
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
          Chaves ficam criptografadas (nunca em texto puro). Cripto via XGate e Pix via
          Woovi. O cashback pode ter um teto por moeda da carteira (USD, BRL ou EUR).
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
          <ProviderCard item={item} key={item.provider} />
        ))}
      </div>
    </Surface>
  )
}
