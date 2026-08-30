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
            Débitos de caixa, battle, arena e upgrade saem do bônus da carteira
            ativa. Sem impacto no saldo real nem em saques.
          </ThemeText>
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
