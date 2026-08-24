import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { StatusPill, TextBadge } from '@/components/StatusPill'
import { labelAdminRole } from '@/i18n/enumLabels'
import { useGetMeQuery } from '@/redux/store/api/auth/api.auth'
import {
  useCreateAdminAccountMutation,
  useGetAdminAccountsQuery,
  useUpdateAdminAccountMutation,
  type AdminAccountRole,
} from '@/redux/store/api/admins/api.admins'
import { setMe } from '@/redux/store/slices/meSlice'
import type { RootState } from '@/redux/store/store'
import type { AdminEntity } from '@/types/admin'
import { getErrorMessage } from '@/utils/getErrorMessage'

type FormState = {
  name: string
  email: string
  role: AdminAccountRole
  password: string
  active: boolean
}

const EMPTY_CREATE: FormState = {
  name: '',
  email: '',
  role: 'ADMIN',
  password: '',
  active: true,
}

function formFromAdmin(admin: AdminEntity): FormState {
  return {
    name: admin.name ?? '',
    email: admin.email ?? '',
    role: admin.role === 'MASTER' ? 'MASTER' : 'ADMIN',
    password: '',
    active: admin.active !== false,
  }
}

export default function AdminsPage() {
  const dispatch = useDispatch()
  const me = useSelector((s: RootState) => s.me)
  const { data: meData, isLoading: meLoading } = useGetMeQuery()
  const role = meData?.role ?? me.role
  const isMaster = role === 'MASTER'

  const { data = [], isLoading, isError, error } = useGetAdminAccountsQuery(
    undefined,
    { skip: !isMaster },
  )
  const [createAdmin, createState] = useCreateAdminAccountMutation()
  const [updateAdmin, updateState] = useUpdateAdminAccountMutation()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminEntity | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_CREATE)
  const [formError, setFormError] = useState<string | null>(null)

  const isCreate = editing == null
  const saving = createState.isLoading || updateState.isLoading

  const title = isCreate ? 'Novo admin' : 'Editar admin'

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_CREATE)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (admin: AdminEntity) => {
    setEditing(admin)
    setForm(formFromAdmin(admin))
    setFormError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
  }

  const passwordHint = useMemo(
    () =>
      isCreate
        ? 'Mínimo 6 caracteres.'
        : 'Deixe em branco para manter a senha atual. Preencha só se quiser trocar.',
    [isCreate],
  )

  if (meLoading && !role) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    )
  }

  if (!isMaster) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async () => {
    setFormError(null)
    const name = form.name.trim()
    const email = form.email.trim().toLowerCase()
    const password = form.password.trim()

    if (!name || !email) {
      setFormError('Nome e e-mail são obrigatórios.')
      return
    }
    if (isCreate && password.length < 6) {
      setFormError('Informe uma senha com no mínimo 6 caracteres.')
      return
    }
    if (!isCreate && password && password.length < 6) {
      setFormError('A nova senha precisa ter no mínimo 6 caracteres.')
      return
    }

    try {
      if (isCreate) {
        await createAdmin({
          name,
          email,
          password,
          role: form.role,
        }).unwrap()
      } else if (editing) {
        const updated = await updateAdmin({
          id: editing._id,
          name,
          email,
          role: form.role,
          active: form.active,
          ...(password ? { password } : {}),
        }).unwrap()
        if (me._id === updated._id) {
          dispatch(
            setMe({
              _id: updated._id,
              name: updated.name,
              email: updated.email,
              role: updated.role,
            }),
          )
        }
      }
      setModalOpen(false)
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle subtitle="E-mail, nível de acesso e senha das contas que entram neste painel. Senha em branco na edição não apaga a atual.">
          Admins
        </PageTitle>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
          Novo admin
        </Button>
      </div>

      <Surface variant="card" className="!p-0 sm:!p-0">
        {isError ? (
          <ThemeText as="p" tone="secondary" className="p-6 text-sm text-red-600">
            {getErrorMessage(error)}
          </ThemeText>
        ) : null}
        <div className={listTable.wrap}>
          <table className={listTable.table}>
            <thead>
              <tr className={listTable.theadRow}>
                <th className={listTable.th}>Nome</th>
                <th className={listTable.th}>E-mail</th>
                <th className={listTable.th}>Nível</th>
                <th className={listTable.th}>Status</th>
                <th className={listTable.th}> </th>
              </tr>
            </thead>
            <tbody className={listTable.tbody}>
              {isLoading ? (
                <tr>
                  <td className={listTable.empty} colSpan={5}>
                    Carregando…
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td className={listTable.empty} colSpan={5}>
                    Nenhum admin cadastrado.
                  </td>
                </tr>
              ) : (
                data.map((admin) => (
                  <tr key={admin._id} className={listTable.tr}>
                    <td className={listTable.tdStrong}>{admin.name}</td>
                    <td className={listTable.td}>{admin.email}</td>
                    <td className={listTable.td}>
                      <TextBadge>{labelAdminRole(admin.role)}</TextBadge>
                    </td>
                    <td className={listTable.td}>
                      <StatusPill active={admin.active} deleted={admin.deleted} />
                    </td>
                    <td className={`${listTable.td} text-right`}>
                      <IconButton
                        type="button"
                        label="Editar"
                        onClick={() => openEdit(admin)}
                      >
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </IconButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      <Modal
        open={modalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal()
          else setModalOpen(true)
        }}
        title={title}
        description={
          isCreate
            ? 'Cria uma conta para acessar o painel.'
            : 'Altere e-mail ou nível sem preencher senha. Só informe senha para trocá-la.'
        }
        size="md"
        footer={
          <>
            <Button type="button" variant="secondary" disabled={saving} onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" isLoading={saving} onClick={() => void handleSubmit()}>
              Salvar
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            name="adminName"
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            autoComplete="off"
          />
          <Input
            label="E-mail"
            name="adminEmail"
            type="email"
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
            autoComplete="off"
          />
          <Select
            label="Nível de acesso"
            name="adminRole"
            value={form.role}
            onChange={(e) =>
              setForm((current) => ({
                ...current,
                role: e.target.value as AdminAccountRole,
              }))
            }
          >
            <option value="ADMIN">{labelAdminRole('ADMIN')}</option>
            <option value="MASTER">{labelAdminRole('MASTER')}</option>
          </Select>
          {!isCreate ? (
            <Select
              label="Status"
              name="adminActive"
              value={form.active ? 'true' : 'false'}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  active: e.target.value === 'true',
                }))
              }
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          ) : null}
          <Input
            label={isCreate ? 'Senha' : 'Nova senha (opcional)'}
            name="adminPassword"
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm((current) => ({ ...current, password: e.target.value }))
            }
            autoComplete="new-password"
            hint={passwordHint}
          />
          {formError ? (
            <ThemeText as="p" className="text-sm text-red-600" tone="secondary">
              {formError}
            </ThemeText>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
