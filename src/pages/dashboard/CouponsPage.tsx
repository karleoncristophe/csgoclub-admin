import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import {
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useGetCouponRewardPresetsQuery,
  useGetCouponsQuery,
  useUpdateCouponMutation,
  type AdminCouponRewardType,
  type AdminCoupon,
} from '@/redux/store/api/coupons/api.coupons'
import { useGetUsersQuery } from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'

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
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all')

  const { data, isLoading, isError, error, isFetching } = useGetCouponsQuery({
    page: 1,
    limit: 100,
    search: search.trim() || undefined,
    ...(activeFilter === 'all' ? {} : { active: activeFilter === 'true' }),
  })
  const { data: rewardPresetsData } = useGetCouponRewardPresetsQuery()

  const { data: influencerList } = useGetUsersQuery({
    page: 1,
    limit: 100,
    dataEnvironment: 'SANDBOX',
  })

  const influencers = useMemo(
    () => (influencerList?.data ?? []).filter((user) => user.userType === 'influencer'),
    [influencerList],
  )

  const influencerById = useMemo(
    () =>
      new Map(
        influencers.map((user) => [user._id, `${user.name} (${user.steamId})`] as const),
      ),
    [influencers],
  )

  const [createCoupon, createState] = useCreateCouponMutation()
  const [updateCoupon, updateState] = useUpdateCouponMutation()
  const [deleteCoupon, deleteState] = useDeleteCouponMutation()

  const [formCode, setFormCode] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formOwnerId, setFormOwnerId] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [formValidFrom, setFormValidFrom] = useState('')
  const [formValidTo, setFormValidTo] = useState('')
  const [formRewardType, setFormRewardType] = useState<AdminCouponRewardType>('DEPOSIT_PERCENT')
  const [formRewardValue, setFormRewardValue] = useState('10')
  const [formMaxUses, setFormMaxUses] = useState('')

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
  const ownerMatches = useMemo(() => {
    const query = ownerSearch.trim().toLowerCase()
    if (!query) return influencers.slice(0, 8)
    return influencers
      .filter((user) =>
        `${user.name} ${user.steamId}`.toLowerCase().includes(query),
      )
      .slice(0, 8)
  }, [ownerSearch, influencers])

  const resetForm = () => {
    setFormCode('')
    setFormDescription('')
    setFormOwnerId('')
    setOwnerSearch('')
    setFormValidFrom('')
    setFormValidTo('')
    setFormRewardType('DEPOSIT_PERCENT')
    setFormRewardValue('10')
    setFormMaxUses('')
  }

  const openCreateModal = () => {
    resetForm()
    setCreateModalOpen(true)
  }

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formCode.trim() || !formOwnerId || !formValidTo) return

    await createCoupon({
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim() || undefined,
      ownerUserId: formOwnerId,
      rewardType: formRewardType,
      rewardValue: Math.max(0, Number(formRewardValue) || 0),
      validFrom: formValidFrom ? new Date(formValidFrom).toISOString() : undefined,
      validTo: new Date(formValidTo).toISOString(),
      maxUses: formMaxUses ? Math.max(1, Number(formMaxUses)) : undefined,
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
        <PageTitle subtitle="Crie cupons de influencer para link de cadastro e vínculo no perfil do usuário.">
          Cupons
        </PageTitle>
        <Button type="button" className="gap-2 px-5 py-3 text-base" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Criar cupom
        </Button>
      </div>

      <Surface variant="card" className="!p-6">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <Input
            label="Buscar"
            name="couponSearch"
            placeholder="Código, descrição ou influencer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Status"
            name="couponStatus"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
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
                    return (
                      <tr key={coupon._id} className={listTable.tr}>
                        <td className={listTable.tdStrong}>{coupon.code}</td>
                        <td className={listTable.td}>{coupon.ownerUserName || coupon.ownerUserId}</td>
                        <td className={listTable.td}>
                          {rewardLabelByType.get(coupon.rewardType) ?? coupon.rewardType} ·{' '}
                          {coupon.rewardValue}
                        </td>
                        <td className={listTable.td}>
                          {isEditing ? (
                            <Input
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
          <div className="w-full max-w-5xl rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <ThemeText as="h2" tone="primary" className="text-xl font-semibold">
                  Criar cupom
                </ThemeText>
                <ThemeText as="p" tone="secondary" className="mt-1 text-sm">
                  Configure o cupom e vincule a um influencer dono.
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

              <div className="relative">
                <Input
                  label="Influencer dono"
                  name="couponOwnerAutocomplete"
                  placeholder="Busque por nome ou Steam ID..."
                  value={ownerSearch}
                  onChange={(event) => {
                    setOwnerSearch(event.target.value)
                    setFormOwnerId('')
                  }}
                />
                {ownerSearch.trim() ? (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
                    {ownerMatches.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-zinc-400">
                        Nenhum influencer encontrado.
                      </div>
                    ) : (
                      ownerMatches.map((user) => {
                        const label = `${user.name} (${user.steamId})`
                        return (
                          <button
                            key={user._id}
                            type="button"
                            onClick={() => {
                              setFormOwnerId(user._id)
                              setOwnerSearch(label)
                            }}
                            className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-800"
                          >
                            <span className="truncate">{user.name}</span>
                            <span className="truncate text-xs text-zinc-400">{user.steamId}</span>
                          </button>
                        )
                      })
                    )}
                  </div>
                ) : null}
                {formOwnerId && !ownerSearch.trim() ? (
                  <p className="mt-1 text-xs text-zinc-500">{influencerById.get(formOwnerId)}</p>
                ) : null}
              </div>

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

              <Input
                label="Valor da recompensa"
                name="couponRewardValue"
                type="number"
                min={0}
                step={String(selectedRewardPreset?.step ?? 1)}
                value={formRewardValue}
                onChange={(e) => setFormRewardValue(e.target.value)}
                hint={
                  selectedRewardPreset
                    ? `Faixa: ${selectedRewardPreset.minValue} - ${selectedRewardPreset.maxValue} · passo ${selectedRewardPreset.step}`
                    : undefined
                }
              />

              <Input
                label="Máx. contas vinculadas"
                name="couponMaxUses"
                type="number"
                min={1}
                placeholder="Sem limite"
                value={formMaxUses}
                onChange={(e) => setFormMaxUses(e.target.value)}
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
