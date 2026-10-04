import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { ArenaCrateItemsTable } from '@/components/arena/ArenaCrateItemsTable'
import { ArenaCrateBankPanel } from '@/components/arena/ArenaCrateBankPanel'
import { ARENA_RARITY_OPTIONS } from '@/components/arena/arenaRarity'
import { CaseEditorSkinSearchSection } from '@/components/cases/editor/CaseEditorSkinSearchSection'
import {
  CaseImageUploader,
  isPendingCaseImage,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { BackLink } from '@/components/ui/BackLink'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import type { SkinsCatalogItem } from '@/redux/store/api/skins/api.skins'
import { usePlatformDataEnvironment } from '@/hooks/usePlatformDataEnvironment'
import { uploadSingleFile } from '@/lib/upload'
import { SkinsCurrency } from '@/constants/skinsCurrency'
import { computeArenaCrateValues } from '@/utils/arenaCrateEconomics'
import { arenaProbabilitySumError } from '@/validators/arenaCrateEditorSchema'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  freeCrateGroupLabel,
  freeCrateThresholdBrl,
  freeCrateUnlockDetails,
  freeCrateUnlockGroup,
  freeCrateUnlockSummary,
} from '@/utils/freeCrateRules'
import type { ArenaCrateItem, ArenaRarity } from '@/redux/store/api/arena/api.arena'
import {
  FREE_KINDS,
  FREE_LABELS,
  useGetFreeCratesQuery,
  useSaveFreeCrateMutation,
  type FreeCrate,
  type FreeKind,
  type FreeCatalog,
} from '@/redux/store/api/free-crates/api.free-crates'

export default function FreeCrateEditorPage() {
  const { kind } = useParams()
  const environment = usePlatformDataEnvironment()
  const { data, isLoading, error } = useGetFreeCratesQuery(environment)

  if (!FREE_KINDS.includes(kind as FreeKind)) {
    return <p>Modalidade inválida.</p>
  }
  if (isLoading) {
    return (
      <ThemeText tone="secondary" className="text-sm">
        Carregando…
      </ThemeText>
    )
  }
  if (!data || error) {
    return <Surface variant="errorBanner">{getErrorMessage(error)}</Surface>
  }

  const crate = data.crates.find((c) => c.kind === kind)
  return (
    <Editor
      key={`${kind}:${crate?.version ?? 0}:${environment}`}
      kind={kind as FreeKind}
      crate={crate}
      banks={data.banks}
      policyEnabled={Boolean(data.policy?.enabled)}
      publishedVersion={
        data.policy?.crates.find((c) => c.kind === kind)?.version
      }
    />
  )
}

function UnlockRulesPanel({ kind }: { kind: FreeKind }) {
  const group = freeCrateUnlockGroup(kind)
  const thresholdBrl = freeCrateThresholdBrl(kind)
  const details = freeCrateUnlockDetails(kind)

  return (
    <Surface variant="settingsPanel" className="space-y-4 !p-5">
      <div>
        <ThemeText as="h2" tone="primary" className="text-base font-semibold">
          Liberação para o jogador
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
          Regras da campanha — independentes do banco/sorteio das skins. O
          limiar de depósito é fixo pela modalidade (espelha o backend).
        </ThemeText>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input label="Modalidade" value={FREE_LABELS[kind]} disabled />
        <Input label="Grupo" value={freeCrateGroupLabel(group)} disabled />
        {thresholdBrl != null ? (
          <CurrencyInput
            label="Depósito mínimo do dia (BRL)"
            name="thresholdBrl"
            value={thresholdBrl}
            currency={SkinsCurrency.BRL}
            disabled
            onChange={() => undefined}
            hint="Fixo pela modalidade · soma dos depósitos elegíveis do dia global"
          />
        ) : (
          <Input
            label="Depósito mínimo do dia (BRL)"
            value={
              kind === 'welcome'
                ? 'Qualquer depósito elegível (1ª vez)'
                : 'R$ 20 para abrir a janela diária'
            }
            disabled
          />
        )}
        <Input
          label="Reset do dia global"
          value="06:00 · América/São Paulo"
          disabled
        />
      </div>

      <div className="rounded-xl border border-separator bg-surface-secondary px-4 py-3">
        <ThemeText as="p" tone="primary" className="text-sm font-medium">
          {freeCrateUnlockSummary(kind)}
        </ThemeText>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </Surface>
  )
}

function Editor({
  kind,
  crate,
  banks,
  policyEnabled,
  publishedVersion,
}: {
  kind: FreeKind
  crate?: FreeCrate
  banks: FreeCatalog['banks']
  policyEnabled: boolean
  publishedVersion?: number
}) {
  const [name, setName] = useState(crate?.name ?? FREE_LABELS[kind])
  const [description, setDescription] = useState(crate?.description ?? '')
  const [rarity, setRarity] = useState<ArenaRarity>(crate?.rarity ?? 'common')
  const [color, setColor] = useState(crate?.color ?? '#4b9cff')
  const [image, setImage] = useState<CaseImageValue>(crate?.imageUrl ?? null)
  const [active, setActive] = useState(crate?.active ?? false)
  const [items, setItems] = useState<ArenaCrateItem[]>(crate?.items ?? [])
  const [display, setDisplay] = useState({
    displayValueBrl: crate?.displayValueBrl ?? 0,
    displayValueUsd: crate?.displayValueUsd ?? 0,
    displayValueEur: crate?.displayValueEur ?? 0,
  })
  const [currency, setCurrency] = useState<SkinsCurrency>(SkinsCurrency.BRL)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [skinsModalOpen, setSkinsModalOpen] = useState(false)
  const [save] = useSaveFreeCrateMutation()

  const addedSkinNames = useMemo(
    () => new Set(items.map((item) => item.skinName)),
    [items],
  )

  const handleToggleSkin = (skin: SkinsCatalogItem) => {
    setItems((current) =>
      current.some((item) => item.skinName === skin.name)
        ? current.filter((item) => item.skinName !== skin.name)
        : [
            ...current,
            {
              skinName: skin.name,
              image: skin.image,
              rarity: skin.rarity,
              probability: 0,
              enabled: true,
              valueBrl: skin.valueBrl,
              valueUsd: skin.valueUsd,
              valueEur: skin.valueEur,
            },
          ],
    )
  }

  const values = computeArenaCrateValues(items)
  const ledger = banks.find((b) => b.key.startsWith(`${crate?._id}:`))?.ledger
  const ev =
    currency === SkinsCurrency.BRL
      ? values.valueBrl
      : currency === SkinsCurrency.USD
        ? values.valueUsd
        : values.valueEur

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    const validation = arenaProbabilitySumError(items)
    if (active && validation) {
      setError(validation)
      return
    }
    setBusy(true)
    try {
      const imageUrl = isPendingCaseImage(image)
        ? (await uploadSingleFile(image.file, 'arena', { crop: image.crop })).url
        : typeof image === 'string'
          ? image
          : ''
      await save({
        kind,
        body: {
          expectedVersion: crate?.version ?? 0,
          name: name.trim(),
          description,
          imageUrl,
          rarity,
          color,
          active,
          items,
          ...display,
        },
      }).unwrap()
      setSaved(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="space-y-6">
        <div className="sticky top-0 z-30 -mx-4 -mt-6 bg-slate-50/85 px-4 py-4 backdrop-blur dark:bg-zinc-950/85 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <BackLink
                fallback="/dashboard/free-crates"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-brand-700 dark:text-zinc-400 dark:hover:text-brand-400"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                Caixas gratuitas
              </BackLink>
              <ThemeText
                as="h1"
                tone="primary"
                className="truncate text-xl font-semibold tracking-tight"
              >
                {FREE_LABELS[kind]}
              </ThemeText>
              <ThemeText as="p" tone="secondary" className="mt-0.5 text-xs">
                Rascunho v{crate?.version ?? 0}
                {publishedVersion != null
                  ? ` · publicada v${publishedVersion}`
                  : ' · ainda não publicada'}
                {' · '}
                campanha {policyEnabled ? 'ativa' : 'pausada'}
              </ThemeText>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {saved ? (
                <ThemeText
                  as="p"
                  role="status"
                  tone="secondary"
                  className="text-sm"
                >
                  Rascunho salvo
                </ThemeText>
              ) : null}
              <Button type="submit" isLoading={busy}>
                Salvar rascunho
              </Button>
            </div>
          </div>
        </div>

        {error ? <Surface variant="errorBanner">{error}</Surface> : null}

        <UnlockRulesPanel kind={kind} />

        <Surface variant="settingsPanel" className="grid gap-4 !p-5 md:grid-cols-2">
          <ThemeText
            as="h2"
            tone="primary"
            className="md:col-span-2 text-base font-semibold"
          >
            Conteúdo e vitrine
          </ThemeText>
          <Input
            label="Nome"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Descrição"
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select
            label="Raridade"
            value={rarity}
            onChange={(e) => setRarity(e.target.value as ArenaRarity)}
          >
            {ARENA_RARITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            label="Cor"
            value={color}
            maxLength={32}
            onChange={(e) => setColor(e.target.value)}
          />
          <CurrencyInput
            label="Valor de vitrine BRL"
            name="displayValueBrl"
            value={display.displayValueBrl}
            currency={SkinsCurrency.BRL}
            onChange={(amount) =>
              setDisplay((current) => ({ ...current, displayValueBrl: amount }))
            }
          />
          <CurrencyInput
            label="Valor de vitrine USD"
            name="displayValueUsd"
            value={display.displayValueUsd}
            currency={SkinsCurrency.USD}
            onChange={(amount) =>
              setDisplay((current) => ({ ...current, displayValueUsd: amount }))
            }
          />
          <CurrencyInput
            label="Valor de vitrine EUR"
            name="displayValueEur"
            value={display.displayValueEur}
            currency={SkinsCurrency.EUR}
            onChange={(amount) =>
              setDisplay((current) => ({ ...current, displayValueEur: amount }))
            }
          />
          <Switch
            label="Pronta para publicação"
            checked={active}
            onChange={setActive}
          />
          <div className="md:col-span-2">
            <CaseImageUploader
              value={image}
              onChange={setImage}
              disabled={busy}
            />
          </div>
        </Surface>

        <Select
          label="Moeda para inspecionar banco e pool de skins"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as SkinsCurrency)}
        >
          {[SkinsCurrency.BRL, SkinsCurrency.USD, SkinsCurrency.EUR].map((c) => (
            <option value={c} key={c}>
              {c}
            </option>
          ))}
        </Select>

        <ArenaCrateBankPanel
          items={items}
          {...values}
          currency={currency}
          ledger={ledger}
          context="free"
        />
        <ArenaCrateItemsTable
          items={items}
          crateValue={ev}
          currency={currency}
          ledger={ledger}
          onItemsChange={setItems}
          context="free"
          headerAction={
            <Button
              type="button"
              size="sm"
              onClick={() => setSkinsModalOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Adicionar skins
            </Button>
          }
        />

      </form>

      <Modal
        open={skinsModalOpen}
        onOpenChange={setSkinsModalOpen}
        title="Adicionar skins"
        description={`${items.length} item(ns) na caixa. Clique na skin para adicionar; clique de novo para remover. Ela entra com os 3 valores de prêmio e chance 0%.`}
        size="full"
        footer={
          <Button type="button" onClick={() => setSkinsModalOpen(false)}>
            Concluir
          </Button>
        }
      >
        <CaseEditorSkinSearchSection
          embedded
          showPrizeValues
          currency={currency}
          addedSkinNames={addedSkinNames}
          onToggleSkin={handleToggleSkin}
        />
      </Modal>
    </div>
  )
}
