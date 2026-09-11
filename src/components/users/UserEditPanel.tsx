import { useEffect, useState } from 'react'
import { Package, Save, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { Switch } from '@/components/ui/Switch'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import {
  useUpdateUserMutation,
  type UserAdminDetail,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'
import {
  userInfluencerBannerClass,
  userStatCardClass,
} from './userPanelClasses'

type UserEditPanelProps = {
  user: UserAdminDetail
  onUpdated?: () => void
}

function formatBrl(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function UserEditPanel({ user, onUpdated }: UserEditPanelProps) {
  const [userType, setUserType] = useState<'standard' | 'influencer'>(
    user.userType ?? (user.isTestAffiliate ? 'influencer' : 'standard'),
  )
  const [skinWithdrawEnabled, setSkinWithdrawEnabled] = useState(
    Boolean(user.influencerSkinWithdrawEnabled),
  )
  const [withdrawLimitInput, setWithdrawLimitInput] = useState(
    String(Math.max(0, Number(user.influencerSkinWithdrawLimitBrl ?? 0))),
  )
  const [updateUser, updateState] = useUpdateUserMutation()

  const isInfluencer =
    user.userType === 'influencer' || Boolean(user.isTestAffiliate)
  const remainingLimit = Math.max(
    0,
    Number(user.influencerSkinWithdrawLimitBrl ?? 0),
  )

  useEffect(() => {
    setUserType(
      user.userType ?? (user.isTestAffiliate ? 'influencer' : 'standard'),
    )
  }, [user.userType, user.isTestAffiliate])

  useEffect(() => {
    setSkinWithdrawEnabled(Boolean(user.influencerSkinWithdrawEnabled))
  }, [user.influencerSkinWithdrawEnabled])

  useEffect(() => {
    setWithdrawLimitInput(String(remainingLimit))
  }, [remainingLimit])

  const isTypeDirty =
    userType !==
    (user.userType ?? (user.isTestAffiliate ? 'influencer' : 'standard'))
  const isWithdrawDirty =
    isInfluencer &&
    skinWithdrawEnabled !== Boolean(user.influencerSkinWithdrawEnabled)

  const handleSaveType = async () => {
    try {
      await updateUser({ id: user._id, userType }).unwrap()
      onUpdated?.()
    } catch {
      // mutation state
    }
  }

  const handleSaveWithdraw = async () => {
    try {
      await updateUser({
        id: user._id,
        influencerSkinWithdrawEnabled: skinWithdrawEnabled,
      }).unwrap()
      onUpdated?.()
    } catch {
      // mutation state
    }
  }

  const parsedWithdrawLimit = Number(withdrawLimitInput.replace(',', '.'))
  const nextWithdrawLimit = Number.isFinite(parsedWithdrawLimit)
    ? Math.max(0, Math.round(parsedWithdrawLimit * 100) / 100)
    : null
  const isLimitDirty =
    nextWithdrawLimit !== null && nextWithdrawLimit !== remainingLimit

  const handleSaveLimit = async () => {
    if (nextWithdrawLimit === null) return

    try {
      await updateUser({
        id: user._id,
        influencerSkinWithdrawLimitBrl: nextWithdrawLimit,
        ...(skinWithdrawEnabled !== Boolean(user.influencerSkinWithdrawEnabled)
          ? { influencerSkinWithdrawEnabled: skinWithdrawEnabled }
          : {}),
      }).unwrap()
      onUpdated?.()
    } catch {
      // mutation state
    }
  }

  return (
    <Surface variant="settingsPanel" className="!p-4">
      <SectionTitle className="mb-1 flex items-center gap-2 text-base">
        <UserCog className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        Editar usuário
      </SectionTitle>
      <ThemeText as="p" tone="faint" className="mb-3 text-xs">
        Influencers usam saldo bônus (não sacável) e ficam fora do fluxo real.
      </ThemeText>

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Select
          label="Tipo de usuário"
          name="userType"
          value={userType}
          onChange={(event) =>
            setUserType(event.target.value as 'standard' | 'influencer')
          }
        >
          <option value="standard">Jogador padrão</option>
          <option value="influencer">Influencer (teste)</option>
        </Select>

        <Button
          type="button"
          disabled={!isTypeDirty || updateState.isLoading}
          onClick={handleSaveType}
        >
          <Save className="h-4 w-4" />
          Salvar tipo
        </Button>
      </div>

      {userType === 'influencer' || isInfluencer ? (
        <div className={`mt-4 ${userInfluencerBannerClass}`}>
          <ThemeText as="p" tone="primary" className="text-sm font-medium">
            Modo influencer ativo
          </ThemeText>
          <ThemeText
            as="p"
            tone="secondary"
            className="mt-1 text-xs leading-relaxed"
          >
            Débitos de caixa, battle, arena e upgrade saem do bônus da carteira
            ativa. Sem impacto no saldo real nem em saques em dinheiro.
          </ThemeText>
        </div>
      ) : null}

      {isInfluencer ? (
        <div className="mt-4 rounded-xl border border-separator bg-surface-secondary p-3">
          <div className="mb-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <ThemeText as="p" tone="primary" className="text-sm font-medium">
              Saque de skins (Steam)
            </ThemeText>
          </div>
          <ThemeText as="p" tone="faint" className="mb-3 text-xs">
            Por padrão bloqueado. Ao habilitar, o influencer consome o limite em
            em reais a cada envio. O valor pode ser corrigido a qualquer
            momento.
          </ThemeText>

          <div
            className={`mb-3 ${
              remainingLimit > 0
                ? userStatCardClass.brand
                : userStatCardClass.amber
            }`}
          >
            <ThemeText
              as="p"
              tone="label"
              className="text-[11px] font-semibold uppercase tracking-wide"
            >
              Limite restante para saque
            </ThemeText>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums tracking-tight ${
                remainingLimit > 0
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}
            >
              {formatBrl(remainingLimit)}
            </p>
            <ThemeText as="p" tone="faint" className="mt-1 text-[11px]">
              {skinWithdrawEnabled
                ? remainingLimit > 0
                  ? 'Disponível para envio via Trade Link'
                  : 'Zerado — defina um limite para liberar novos saques'
                : 'Saque desligado — o limite só vale com o switch ativo'}
            </ThemeText>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <Switch
              label="Permitir saque de skins"
              name="influencerSkinWithdrawEnabled"
              checked={skinWithdrawEnabled}
              onChange={setSkinWithdrawEnabled}
              description={
                skinWithdrawEnabled
                  ? 'Saque via Trade Link liberado (consome o limite)'
                  : 'Saque via Trade Link desligado'
              }
            />
            <Button
              type="button"
              disabled={!isWithdrawDirty || updateState.isLoading}
              onClick={handleSaveWithdraw}
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Limite para saque (BRL)"
                name="influencerSkinWithdrawLimitBrl"
                type="number"
                min="0"
                step="0.01"
                placeholder="500,00"
                value={withdrawLimitInput}
                onChange={(event) => setWithdrawLimitInput(event.target.value)}
              />
            </div>
            <Button
              type="button"
              disabled={updateState.isLoading || !isLimitDirty}
              onClick={handleSaveLimit}
            >
              Salvar valor
            </Button>
          </div>
        </div>
      ) : null}

      {updateState.error ? (
        <p className={`${surfaceClass('errorBanner')} mt-4`}>
          {getErrorMessage(updateState.error)}
        </p>
      ) : null}
    </Surface>
  )
}
