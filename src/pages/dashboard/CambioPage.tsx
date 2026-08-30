import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SegmentedTabs } from '@/components/ui/SegmentedTabs'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import {
  useGetCambioSettingsQuery,
  useUpdateCambioSettingsMutation,
} from '@/redux/store/api/cambio/api.cambio'
import { PaymentProvidersPanel } from '@/pages/dashboard/PaymentProvidersPanel'
import { getErrorMessage } from '@/utils/getErrorMessage'

const TABS = [
  { id: 'cambio', label: 'Câmbio' },
  { id: 'apis', label: 'APIs de pagamento' },
] as const

type CambioTab = (typeof TABS)[number]['id']

function isCambioTab(value: string | null): value is CambioTab {
  return TABS.some((tab) => tab.id === value)
}

const PROVIDER_COPY: Record<string, { label: string; description: string }> = {
  skinsback: {
    label: 'SkinsBack (principal)',
    description:
      'Sempre tenta primeiro. Mesma cotação do catálogo de skins — casa e jogador não se desalinham.',
  },
  awesomeapi: {
    label: 'AwesomeAPI (reserva)',
    description:
      'Usada só se a SkinsBack falhar. Dólar comercial ao vivo, não é a cotação do Google.',
  },
  frankfurter: {
    label: 'Frankfurter (reserva)',
    description:
      'Usada só se a SkinsBack falhar. Cotação do BCE via euro — pode subir ou descer vs o Google.',
  },
}

function formatWhen(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR')
}

export default function CambioPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const tab: CambioTab = isCambioTab(tabParam) ? tabParam : 'cambio'
  const { data, isLoading, isError, error } = useGetCambioSettingsQuery()
  const [saveSettings, saveState] = useUpdateCambioSettingsMutation()
  const [provider, setProvider] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!data) return
    setProvider(data.provider)
  }, [data])

  const handleSave = async () => {
    if (!provider) return
    setFormError(null)
    try {
      await saveSettings({ provider }).unwrap()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const dirty = Boolean(data && provider && provider !== data.provider)

  if (tabParam === 'transacoes') {
    return <Navigate replace to="/dashboard/deposits" />
  }

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'cambio') params.delete('tab')
    else params.set('tab', next)
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Câmbio da carteira e chaves das APIs de pagamento. O histórico de Pix e cripto fica em Depósitos.">
        Câmbio
      </PageTitle>

      <SegmentedTabs
        ariaLabel="Seções de câmbio e pagamento"
        value={tab}
        onChange={setTab}
        items={[...TABS]}
      />

      {tab === 'apis' ? <PaymentProvidersPanel /> : null}

      {tab === 'cambio' ? (
        <>
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <div className="space-y-1">
              <p className="font-medium">A conversão não segue o Google</p>
              <p>
                O valor pode ficar para cima ou para baixo em relação ao Google,
                PTAX ou qualquer conversor. Isso não é erro: cada API tem a própria
                cotação. A SkinsBack é o padrão da loja. AwesomeAPI e Frankfurter só
                entram se a SkinsBack falhar.
              </p>
            </div>
          </div>

          <Surface variant="settingsPanel" className="!p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <ThemeText as="h2" tone="primary" className="text-base font-semibold">
                  API de reserva
                </ThemeText>
                <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                  A SkinsBack sempre tenta primeiro. A opção marcada abaixo é a
                  reserva se ela estiver fora.
                </ThemeText>
              </div>
              <Button
                type="button"
                onClick={() => void handleSave()}
                isLoading={saveState.isLoading}
                disabled={isLoading || !provider || !dirty}
              >
                Salvar
              </Button>
            </div>

            {isLoading ? (
              <ThemeText tone="secondary" className="text-sm">
                Carregando APIs...
              </ThemeText>
            ) : null}

            {isError ? (
              <Surface variant="errorBanner">{getErrorMessage(error)}</Surface>
            ) : null}

            {formError ? (
              <Surface variant="errorBanner" className="mb-4">
                {formError}
              </Surface>
            ) : null}

            {!isLoading && !isError ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {(data?.providers ?? []).map((item) => {
                  const selected = provider === item.value
                  const copy = PROVIDER_COPY[item.value] ?? item
                  const isPrimary = item.value === 'skinsback'
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setProvider(item.value)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? 'border-brand-500 bg-brand-500/15 dark:border-brand-400'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <ThemeText as="p" tone="primary" className="font-semibold">
                          {copy.label}
                        </ThemeText>
                        {selected ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </span>
                        ) : (
                          <span className="h-6 w-6 rounded-full border border-zinc-300 dark:border-zinc-600" />
                        )}
                      </div>
                      {isPrimary ? (
                        <ThemeText
                          as="p"
                          tone="brand"
                          className="mt-1 text-xs font-medium"
                        >
                          Sempre usada primeiro
                        </ThemeText>
                      ) : null}
                      <ThemeText as="p" tone="secondary" className="mt-2 text-sm">
                        {copy.description}
                      </ThemeText>
                    </button>
                  )
                })}
              </div>
            ) : null}

            {data?.updatedAt ? (
              <ThemeText as="p" tone="secondary" className="mt-4 text-xs">
                Última atualização: {formatWhen(data.updatedAt)}
              </ThemeText>
            ) : null}
          </Surface>
        </>
      ) : null}
    </div>
  )
}
