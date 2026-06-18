import { useEffect, useState } from 'react'
import { Save, UserCog } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import {
  useUpdateUserMutation,
  type UserAdminDetail,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { userInfluencerBannerClass } from './userPanelClasses'
import { UserWalletPanel } from './UserWalletPanel'

type UserEditPanelProps = {
  user: UserAdminDetail
  onUpdated?: () => void
}

export function UserEditPanel({ user, onUpdated }: UserEditPanelProps) {
  const [userType, setUserType] = useState<'standard' | 'influencer'>(
    user.userType ?? (user.isTestAffiliate ? 'influencer' : 'standard'),
  )
  const [updateUser, updateState] = useUpdateUserMutation()

  useEffect(() => {
    setUserType(
      user.userType ?? (user.isTestAffiliate ? 'influencer' : 'standard'),
    )
  }, [user.userType, user.isTestAffiliate])

  const isDirty =
    userType !==
    (user.userType ?? (user.isTestAffiliate ? 'influencer' : 'standard'))

  const handleSaveType = async () => {
    try {
      await updateUser({ id: user._id, userType }).unwrap()
      onUpdated?.()
    } catch {
      // mutation state
    }
  }

  return (
    <>
      <Surface variant="card" className="!p-6">
        <SectionTitle className="mb-2 flex items-center gap-2">
          <UserCog className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          Editar usuário
        </SectionTitle>
        <ThemeText as="p" tone="secondary" className="mb-5 text-sm">
          Influencers usam saldo bônus (fake), abrem caixas com margem de teste separada e não
          podem sacar. Tudo fora do fluxo principal da plataforma.
        </ThemeText>

        <div className="grid gap-4 md:grid-cols-[minmax(0,280px)_auto] md:items-end">
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
            disabled={!isDirty || updateState.isLoading}
            onClick={handleSaveType}
          >
            <Save className="h-4 w-4" />
            Salvar tipo
          </Button>
        </div>

        {userType === 'influencer' ? (
          <div className={`mt-4 ${userInfluencerBannerClass}`}>
            <ThemeText as="p" tone="primary" className="text-sm font-medium">
              Modo influencer ativo
            </ThemeText>
            <ThemeText as="p" tone="secondary" className="mt-1 text-xs leading-relaxed">
              Aberturas debitam saldo bônus, acumulam margem fake na caixa e permitem guardar itens
              no inventário do site — sem impacto no ledger real nem em saques.
            </ThemeText>
          </div>
        ) : null}

        {updateState.error ? (
          <p className={`${surfaceClass('errorBanner')} mt-4`}>
            {getErrorMessage(updateState.error)}
          </p>
        ) : null}
      </Surface>

      <UserWalletPanel user={user} />
    </>
  )
}
