import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import useDebounce from '@/hooks/useDebounce'
import { useUrlFilters } from '@/hooks/useUrlFilters'
import {
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useGetCouponRewardPresetsQuery,
  useGetCouponsQuery,
  useUpdateCouponMutation,
  type AdminCoupon,
  type AdminCouponAmounts,
  type AdminCouponCurrencyAmounts,
  type AdminCouponRewardType,
} from '@/redux/store/api/coupons/api.coupons'
import { useGetUsersQuery } from '@/redux/store/api/users/api.users'
import {
  formatSkinsPrice,
  SKINS_CURRENCY_OPTIONS,
  SkinsCurrency,
} from '@/constants/skinsCurrency'
import { getErrorMessage } from '@/utils/getErrorMessage'

const COUPONS_FILTER_DEFAULTS = {
  q: '',
  active: 'all',
}

type CouponAmountFormSlice = {
  minimumAmount: string
  maximumAmount: string
  maximumDiscount: string
  rewardValue: string
}

function emptyAmountFormSlice(): CouponAmountFormSlice {
  return {
    minimumAmount: '',
    maximumAmount: '',
    maximumDiscount: '',
    rewardValue: '',
  }
}

function emptyAmountsForm(): Record<SkinsCurrency, CouponAmountFormSlice> {
  return {
    [SkinsCurrency.BRL]: emptyAmountFormSlice(),
    [SkinsCurrency.USD]: emptyAmountFormSlice(),
    [SkinsCurrency.EUR]: emptyAmountFormSlice(),
  }
}

function parseOptionalAmount(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function buildCouponAmountsPayload(
  currencies: SkinsCurrency[],
  formAmounts: Record<SkinsCurrency, CouponAmountFormSlice>,
  valueKind?: string,
): AdminCouponAmounts {
  const amounts: AdminCouponAmounts = {}
  for (const currency of currencies) {
    const slice = formAmounts[currency]
    const next: AdminCouponCurrencyAmounts = {
      minimumAmount: parseOptionalAmount(slice.minimumAmount),
      maximumAmount: parseOptionalAmount(slice.maximumAmount),
    }
    if (valueKind === 'percent') {
      next.maximumDiscount = parseOptionalAmount(slice.maximumDiscount)
    }
    if (valueKind === 'fixed') {
      next.rewardValue = parseOptionalAmount(slice.rewardValue)
    }
    amounts[currency] = next
  }
  return amounts
}

function formatCouponAmountsLine(coupon: AdminCoupon): string | null {
  const currencies = coupon.currencies?.length
    ? coupon.currencies
    : ([SkinsCurrency.BRL, SkinsCurrency.USD, SkinsCurrency.EUR] as const)
  const parts = currencies.flatMap((currency) => {
    const slice = coupon.amounts?.[currency]
    if (!slice) return []
    const bits: string[] = []
    if (slice.rewardValue != null) {
      bits.push(formatSkinsPrice(slice.rewardValue, currency))
    }
    if (slice.minimumAmount != null) {
      bits.push(`min ${formatSkinsPrice(slice.minimumAmount, currency)}`)
    }
    if (slice.maximumAmount != null) {
      bits.push(`máx ${formatSkinsPrice(slice.maximumAmount, currency)}`)
    }
    if (slice.maximumDiscount != null) {
      bits.push(`teto ${formatSkinsPrice(slice.maximumDiscount, currency)}`)
    }
    return bits.length ? [`${currency} ${bits.join(' · ')}`] : []
  })
  return parts.length ? parts.join(' · ') : null
}

function toDateTimeLocal(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const tzOffset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16)
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const FALLBACK_REWARD_TYPE_OPTIONS: Array<{ value: AdminCouponRewardType; label: string }> = [
  { value: 'DEPOSIT_PERCENT', label: 'Desconto em depósito (%)' },
  { value: 'DEPOSIT_FIXED', label: 'Desconto fixo em depósito' },
  { value: 'DEPOSIT_BONUS_PERCENT', label: 'Bônus extra em depósito (%)' },
  { value: 'DEPOSIT_CASHBACK_PERCENT', label: 'Cashback em depósito (%)' },
  { value: 'CASE_PRICE_PERCENT', label: 'Desconto em abertura de caixa (%)' },
  { value: 'CASE_PRICE_FIXED', label: 'Desconto fixo em abertura de caixa' },
  { value: 'FREE_CASE_OPEN', label: 'Abertura grátis de caixa' },
  { value: 'ARENA_TICKET', label: 'Tickets de Arena' },
  { value: 'UPGRADE_PERCENT', label: 'Desconto no upgrade (%)' },
  { value: 'UPGRADE_BONUS_CHANCE', label: 'Chance extra no upgrade (%)' },
  { value: 'WITHDRAW_FEE_DISCOUNT_PERCENT', label: 'Desconto em taxa de saque (%)' },
  { value: 'LOYALTY_POINTS_MULTIPLIER', label: 'Multiplicador de pontos de fidelidade' },
  { value: 'BATTLEPASS_XP_BOOST', label: 'Boost de XP de battlepass (%)' },
  { value: 'CUSTOM', label: 'Regra customizada' },
]

export default function CouponsPage() {
  const { confirm } = useConfirm()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { filters, setFilters, setFilter } = useUrlFilters(COUPONS_FILTER_DEFAULTS)

  const [searchInput, setSearchInput] = useState(filters.q)
  useEffect(() => {
    setSearchInput(filters.q)
  }, [filters.q])

  const debouncedSearch = useDebounce(searchInput.trim(), 350)
  useEffect(() => {
    if (debouncedSearch === filters.q) return
    setFilters({ q: debouncedSearch })
  }, [debouncedSearch, filters.q, setFilters])

  const activeFilter = filters.active as 'all' | 'true' | 'false'

  const { data, isLoading, isError, error, isFetching } = useGetCouponsQuery({
    page: 1,
    limit: 100,
    search: debouncedSearch || undefined,
    ...(activeFilter === 'all' ? {} : { active: activeFilter === 'true' }),
  })
  const { data: rewardPresetsData } = useGetCouponRewardPresetsQuery()

  const [influencerSearch, setInfluencerSearch] = useState('')
  const [selectedInfluencer, setSelectedInfluencer] =
    useState<SearchableSelectOption | null>(null)

  const { data: influencerList, isFetching: influencersLoading } = useGetUsersQuery({
    page: 1,
    limit: 20,
    search: influencerSearch.trim() || undefined,
    dataEnvironment: 'SANDBOX',
  })

  const influencerOptions = useMemo(
    () =>
      (influencerList?.data ?? []).map((user) => ({
        value: user._id,
        label: user.name,
        description: user.steamId,
        imageUrl: user.avatarMedium || user.avatar || user.avatarFull || undefined,
      })),
    [influencerList],
  )

  const handleInfluencerSearch = useCallback((query: string) => {
    setInfluencerSearch(query)
  }, [])

  const handleInfluencerChange = useCallback(
    (nextId: string) => {
      setFormOwnerId(nextId)
      if (!nextId) {
        setSelectedInfluencer(null)
        return
      }
      const fromList = influencerOptions.find((option) => option.value === nextId)
      if (fromList) setSelectedInfluencer(fromList)
    },
    [influencerOptions],
  )

  const [createCoupon, createState] = useCreateCouponMutation()
  const [updateCoupon, updateState] = useUpdateCouponMutation()
  const [deleteCoupon, deleteState] = useDeleteCouponMutation()

  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formOwnerId, setFormOwnerId] = useState('')
  const [formValidFrom, setFormValidFrom] = useState('')
  const [formValidTo, setFormValidTo] = useState('')
  const [formRewardType, setFormRewardType] = useState<AdminCouponRewardType>('DEPOSIT_PERCENT')
  const [formRewardValue, setFormRewardValue] = useState('10')
  const [formCurrencies, setFormCurrencies] = useState<SkinsCurrency[]>([
    SkinsCurrency.BRL,
    SkinsCurrency.USD,
    SkinsCurrency.EUR,
  ])
  const [formAmounts, setFormAmounts] = useState(emptyAmountsForm)
  const [formMaxUses, setFormMaxUses] = useState('')
  const [formMaxUsesPerUser, setFormMaxUsesPerUser] = useState('1')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editActive, setEditActive] = useState(true)
  const [editValidTo, setEditValidTo] = useState('')

  const list = data?.data ?? []
  const rewardPresets = rewardPresetsData ?? []
  const rewardTypeOptions = useMemo(
    () =>
      rewardPresets.length > 0
        ? rewardPresets.map((preset) => ({
            value: preset.type,
            label: preset.label,
          }))
        : FALLBACK_REWARD_TYPE_OPTIONS,
    [rewardPresets],
  )
  const rewardLabelByType = useMemo(
    () => new Map(rewardTypeOptions.map((item) => [item.value, item.label] as const)),
    [rewardTypeOptions],
  )
  const rewardPresetByType = useMemo(
    () =>
      new Map(
        rewardPresets.map((preset) => [preset.type, preset] as const),
      ),
    [rewardPresets],
  )
  const selectedRewardPreset = rewardPresetByType.get(formRewardType)

  const resetForm = () => {
    setFormCode('')
    setFormDescription('')
    setFormOwnerId('')
    setSelectedInfluencer(null)
    setInfluencerSearch('')
    setFormValidFrom('')
    setFormValidTo('')
    setFormRewardType('DEPOSIT_PERCENT')
    setFormRewardValue('10')
    setFormCurrencies([SkinsCurrency.BRL, SkinsCurrency.USD, SkinsCurrency.EUR])
    setFormAmounts(emptyAmountsForm())
    setFormMaxUses('')
    setFormMaxUsesPerUser('1')
  }

  const patchFormAmount = (
    currency: SkinsCurrency,
    field: keyof CouponAmountFormSlice,
    value: string,
  ) => {
    setFormAmounts((current) => ({
      ...current,
      [currency]: { ...current[currency], [field]: value },
    }))
  }

  const openCreateModal = () => {
    resetForm()
    setCreateModalOpen(true)
  }

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formCode.trim() || !formOwnerId || !formValidTo) return

    const valueKind = selectedRewardPreset?.valueKind
    await createCoupon({
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim() || undefined,
      ownerUserId: formOwnerId,
      rewardType: formRewardType,
      rewardValue:
        valueKind === 'fixed'
          ? undefined
          : Math.max(0, Number(formRewardValue) || 0),
      currencies: formCurrencies,
      amounts: buildCouponAmountsPayload(formCurrencies, formAmounts, valueKind),
      validFrom: formValidFrom ? new Date(formValidFrom).toISOString() : undefined,
      validTo: new Date(formValidTo).toISOString(),
      maxUses: formMaxUses ? Math.max(1, Number(formMaxUses)) : undefined,
      maxUsesPerUser: formMaxUsesPerUser
        ? Math.max(1, Number(formMaxUsesPerUser))
        : undefined,
    }).unwrap()

    resetForm()
    setCreateModalOpen(false)
  }

  const startEdit = (coupon: AdminCoupon) => {
    setEditingId(coupon._id)
    setEditActive(coupon.active)
    setEditValidTo(toDateTimeLocal(coupon.validTo))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditActive(true)
    setEditValidTo('')
  }

  const saveEdit = async (id: string) => {
    await updateCoupon({
      id,
      active: editActive,
      validTo: editValidTo ? new Date(editValidTo).toISOString() : undefined,
    }).unwrap()
    cancelEdit()
  }

  const handleDelete = async (coupon: AdminCoupon) => {
    const confirmed = await confirm({
      title: 'Excluir cupom',
      description: 'O cupom ficará inativo e removido da listagem principal.',
      subjectLabel: 'Cupom',
      subjectName: coupon.code,
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      warning: 'Essa ação não poderá ser desfeita.',
    })
    if (!confirmed) return
    await deleteCoupon(coupon._id).unwrap()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle="Percentual e tickets são iguais em todas as carteiras. Valores em dinheiro são definidos por moeda — sem câmbio.">
          Cupons
        </PageTitle>
        <Button type="button" className="gap-2 px-5 py-3 text-base" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Criar cupom
        </Button>
      </div>

      <Surface variant="card" className="!p-5">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            label="Buscar"
            name="couponSearch"
            placeholder="Código, descrição ou influencer"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Select
            label="Status"
            name="couponStatus"
            value={activeFilter}
            onChange={(e) => setFilter('active', e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </Select>
        </div>

        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="py-8 text-sm">
            Carregando cupons...
          </ThemeText>
        ) : null}

        {isError ? <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p> : null}

        {!isLoading && !isError ? (
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Código</th>
                  <th className={listTable.th}>Influencer</th>
                  <th className={listTable.th}>Recompensa</th>
                  <th className={listTable.th}>Validade</th>
                  <th className={listTable.th}>Vínculos</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th}>Ações</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={listTable.empty}>
                      Nenhum cupom encontrado.
                    </td>
                  </tr>
                ) : (
                  list.map((coupon) => {
                    const isEditing = editingId === coupon._id
                    const amountsLine = formatCouponAmountsLine(coupon)
                    const rewardKind = rewardPresetByType.get(coupon.rewardType)?.valueKind
                    return (
                      <tr key={coupon._id} className={listTable.tr}>
                        <td className={listTable.tdStrong}>{coupon.code}</td>
                        <td className={listTable.td}>{coupon.ownerUserName || coupon.ownerUserId}</td>
                        <td className={listTable.td}>
                          {rewardLabelByType.get(coupon.rewardType) ?? coupon.rewardType}
                          {rewardKind === 'fixed' ? null : ` · ${coupon.rewardValue}`}
                          {coupon.currencies?.length ? (
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              {coupon.currencies.join(' · ')}
                            </span>
                          ) : null}
                          {amountsLine ? (
                            <span className="mt-0.5 block text-xs text-zinc-500">
                              {amountsLine}
                            </span>
                          ) : null}
                        </td>
                        <td className={listTable.td}>
                          {isEditing ? (
                            <Input
                              label="Válido até"
                              name={`edit-valid-to-${coupon._id}`}
                              type="datetime-local"
                              value={editValidTo}
                              onChange={(e) => setEditValidTo(e.target.value)}
                            />
                          ) : (
                            formatDateTime(coupon.validTo)
                          )}
                        </td>
                        <td className={listTable.td}>{coupon.assignedUsersCount}</td>
                        <td className={listTable.td}>
                          {isEditing ? (
                            <Select
                              name={`edit-active-${coupon._id}`}
                              value={editActive ? 'true' : 'false'}
                              onChange={(e) => setEditActive(e.target.value === 'true')}
                              label="Status"
                            >
                              <option value="true">Ativo</option>
                              <option value="false">Inativo</option>
                            </Select>
                          ) : coupon.active ? (
                            <span className="text-emerald-600 dark:text-emerald-300">Ativo</span>
                          ) : (
                            <span className="text-zinc-500">Inativo</span>
                          )}
                        </td>
                        <td className={listTable.td}>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                isLoading={updateState.isLoading}
                                onClick={() => saveEdit(coupon._id)}
                              >
                                Salvar
                              </Button>
                              <Button size="sm" variant="secondary" onClick={cancelEdit}>
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <IconButton label="Editar cupom" onClick={() => startEdit(coupon)}>
                                <Pencil className="h-4 w-4" />
                              </IconButton>
                              <IconButton
                                label="Excluir cupom"
                                variant="danger"
                                disabled={deleteState.isLoading}
                                onClick={() => handleDelete(coupon)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </IconButton>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {isFetching && !isLoading ? (
          <ThemeText as="p" tone="faint" className="mt-3 text-xs">
            Atualizando listagem...
          </ThemeText>
        ) : null}

        {updateState.isError ? (
          <p className={`mt-4 ${surfaceClass('errorBanner')}`}>
            {getErrorMessage(updateState.error)}
          </p>
        ) : null}

        {deleteState.isError ? (
          <p className={`mt-4 ${surfaceClass('errorBanner')}`}>
            {getErrorMessage(deleteState.error)}
          </p>
        ) : null}
      </Surface>

      {createModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <ThemeText as="h2" tone="primary" className="text-xl font-semibold">
                  Criar cupom
                </ThemeText>
                <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                  Moedas, percentual ou tickets. Valores em dinheiro são por carteira.
                </ThemeText>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                aria-label="Fechar modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input
                label="Código"
                name="couponCode"
                placeholder="KAKU10"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
              />

              <SearchableSelect
                label="Influencer dono"
                placeholder="Selecionar influencer…"
                searchPlaceholder="Filtrar por nome ou Steam ID…"
                modalTitle="Escolher influencer"
                modalDescription="Mostra os influencers do servidor (independente da visão Prod/Dev). Primeiros 20; filtre por nome ou Steam ID."
                options={influencerOptions}
                value={formOwnerId}
                onChange={handleInfluencerChange}
                selectedOption={selectedInfluencer}
                serverSearch
                onSearchChange={handleInfluencerSearch}
                loading={influencersLoading}
                totalCount={influencerList?.total ?? influencerOptions.length}
                resultNoun="influencer"
                emptyMessage="Nenhum influencer encontrado para essa busca."
                hint="Lista sempre os influencers do servidor, mesmo em visão Produção."
              />

              <Input
                label="Expira em"
                name="couponValidTo"
                type="datetime-local"
                value={formValidTo}
                onChange={(e) => setFormValidTo(e.target.value)}
              />

              <Input
                label="Descrição"
                name="couponDescription"
                placeholder="Cupom oficial do influencer"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />

              <Input
                label="Válido a partir de"
                name="couponValidFrom"
                type="datetime-local"
                value={formValidFrom}
                onChange={(e) => setFormValidFrom(e.target.value)}
              />

              <Select
                label="Tipo de recompensa"
                name="couponRewardType"
                value={formRewardType}
                onChange={(e) => {
                  const nextType = e.target.value as AdminCouponRewardType
                  setFormRewardType(nextType)
                  const preset = rewardPresetByType.get(nextType)
                  if (preset) {
                    setFormRewardValue(String(preset.defaultValue))
                  }
                }}
              >
                {rewardTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>

              {selectedRewardPreset?.valueKind === 'fixed' ? null : (
                <Input
                  label={
                    selectedRewardPreset?.valueKind === 'percent'
                      ? 'Percentual (%)'
                      : selectedRewardPreset?.valueKind === 'count'
                        ? 'Tickets / quantidade'
                        : 'Valor da recompensa'
                  }
                  name="couponRewardValue"
                  type="number"
                  min={0}
                  step={String(selectedRewardPreset?.step ?? 1)}
                  value={formRewardValue}
                  onChange={(e) => setFormRewardValue(e.target.value)}
                  hint={
                    selectedRewardPreset
                      ? `Faixa: ${selectedRewardPreset.minValue} - ${selectedRewardPreset.maxValue}`
                      : undefined
                  }
                />
              )}

              <div className="xl:col-span-3">
                <ThemeText as="p" tone="label" className="mb-2 text-sm font-medium">
                  Moedas
                </ThemeText>
                <div className="flex flex-wrap gap-4">
                  {SKINS_CURRENCY_OPTIONS.map((option) => (
                    <Checkbox
                      key={option.value}
                      id={`coupon-currency-${option.value}`}
                      name={`couponCurrency-${option.value}`}
                      label={option.label}
                      checked={formCurrencies.includes(option.value)}
                      onChange={(event) => {
                        const checked = event.target.checked
                        setFormCurrencies((current) => {
                          if (checked) {
                            return current.includes(option.value)
                              ? current
                              : [...current, option.value]
                          }
                          const next = current.filter((code) => code !== option.value)
                          return next.length > 0 ? next : current
                        })
                      }}
                    />
                  ))}
                </div>
                <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                  O cupom só vale nessas carteiras. Cada uma tem min, máx e valor
                  fixo próprios — R$ 50 não é US$ 50.
                </ThemeText>
              </div>

              {formCurrencies.map((currency) => {
                const option = SKINS_CURRENCY_OPTIONS.find((item) => item.value === currency)
                const slice = formAmounts[currency]
                return (
                  <div
                    key={currency}
                    className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                  >
                    <ThemeText as="h3" tone="primary" className="text-sm font-semibold">
                      {option?.label ?? currency}
                    </ThemeText>
                    {selectedRewardPreset?.valueKind === 'fixed' ? (
                      <Input
                        label="Valor fixo"
                        name={`couponRewardValue-${currency}`}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Obrigatório"
                        value={slice.rewardValue}
                        onChange={(e) =>
                          patchFormAmount(currency, 'rewardValue', e.target.value)
                        }
                      />
                    ) : null}
                    <Input
                      label="Compra mínima"
                      name={`couponMinimumAmount-${currency}`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Sem mínimo"
                      value={slice.minimumAmount}
                      onChange={(e) =>
                        patchFormAmount(currency, 'minimumAmount', e.target.value)
                      }
                    />
                    <Input
                      label="Compra máxima"
                      name={`couponMaximumAmount-${currency}`}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="Sem máximo"
                      value={slice.maximumAmount}
                      onChange={(e) =>
                        patchFormAmount(currency, 'maximumAmount', e.target.value)
                      }
                    />
                    {selectedRewardPreset?.valueKind === 'percent' ? (
                      <Input
                        label="Teto de desconto"
                        name={`couponMaximumDiscount-${currency}`}
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="Sem teto"
                        value={slice.maximumDiscount}
                        onChange={(e) =>
                          patchFormAmount(currency, 'maximumDiscount', e.target.value)
                        }
                      />
                    ) : null}
                  </div>
                )
              })}

              <Input
                label="Máx. contas vinculadas"
                name="couponMaxUses"
                type="number"
                min={1}
                placeholder="Sem limite"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
              />

              <Input
                label="Máx. usos por usuário"
                name="couponMaxUsesPerUser"
                type="number"
                min={1}
                value={formMaxUsesPerUser}
                onChange={(e) => setFormMaxUsesPerUser(e.target.value)}
              />

              <div className="flex items-end justify-end gap-2 xl:col-span-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={createState.isLoading}
                  disabled={!formCode.trim() || !formOwnerId || !formValidTo}
                >
                  Criar cupom
                </Button>
              </div>
            </form>

            {createState.isError ? (
              <p className={`mt-4 ${surfaceClass('errorBanner')}`}>
                {getErrorMessage(createState.error)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
