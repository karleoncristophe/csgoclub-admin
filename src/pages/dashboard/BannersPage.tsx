import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  BannerImageUploader,
  isPendingBannerImage,
  type BannerImageValue,
} from '@/components/banners/BannerImageUploader'
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { IconButton } from '@/components/ui/IconButton'
import { Input } from '@/components/ui/Input'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { TextBadge } from '@/components/StatusPill'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { uploadSingleFile } from '@/lib/upload'
import {
  useCreateBannerMutation,
  useDeleteBannerMutation,
  useGetBannersQuery,
  useUpdateBannerMutation,
  type SiteBanner,
} from '@/redux/store/api/banners/api.banners'
import { getErrorMessage } from '@/utils/getErrorMessage'

type BannerFormState = {
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
  sortOrder: string
  active: boolean
  image: BannerImageValue
}

const emptyForm = (): BannerFormState => ({
  title: '',
  subtitle: '',
  ctaLabel: '',
  ctaHref: '',
  sortOrder: '0',
  active: true,
  image: null,
})

function formFromBanner(banner: SiteBanner): BannerFormState {
  return {
    title: banner.title ?? '',
    subtitle: banner.subtitle ?? '',
    ctaLabel: banner.ctaLabel ?? '',
    ctaHref: banner.ctaHref ?? '',
    sortOrder: String(banner.sortOrder ?? 0),
    active: banner.active,
    image: banner.imageUrl,
  }
}

export default function BannersPage() {
  const { confirm } = useConfirm()
  const { data = [], isLoading, isError, error } = useGetBannersQuery()
  const [createBanner, createState] = useCreateBannerMutation()
  const [updateBanner, updateState] = useUpdateBannerMutation()
  const [deleteBanner, deleteState] = useDeleteBannerMutation()

  const [createForm, setCreateForm] = useState<BannerFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<BannerFormState>(emptyForm)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const resetCreateForm = () => {
    setCreateForm(emptyForm())
    setFormError(null)
  }

  const startEdit = (banner: SiteBanner) => {
    setEditingId(banner._id)
    setEditForm(formFromBanner(banner))
    setFormError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(emptyForm())
    setFormError(null)
  }

  const resolveImageUrl = async (
    image: BannerImageValue,
    previousUrl?: string,
  ): Promise<string | undefined> => {
    if (isPendingBannerImage(image)) {
      const uploaded = await uploadSingleFile(image.file, 'banners')
      return uploaded.url
    }
    if (typeof image === 'string' && image.trim()) {
      return image.trim()
    }
    return previousUrl
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!createForm.image) {
      setFormError('Envie e recorte a imagem do banner.')
      return
    }

    try {
      const imageUrl = await resolveImageUrl(createForm.image)
      if (!imageUrl) {
        setFormError('Falha ao enviar a imagem.')
        return
      }

      await createBanner({
        title: createForm.title.trim() || undefined,
        subtitle: createForm.subtitle.trim() || undefined,
        ctaLabel: createForm.ctaLabel.trim() || undefined,
        ctaHref: createForm.ctaHref.trim() || undefined,
        sortOrder: Number(createForm.sortOrder) || 0,
        active: createForm.active,
        imageUrl,
      }).unwrap()
      resetCreateForm()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const handleSaveEdit = async (id: string) => {
    setFormError(null)
    const previous = data.find((item) => item._id === id)

    try {
      const imageUrl = await resolveImageUrl(editForm.image, previous?.imageUrl)
      if (!imageUrl) {
        setFormError('Banner precisa de uma imagem.')
        return
      }

      await updateBanner({
        id,
        title: editForm.title.trim() || undefined,
        subtitle: editForm.subtitle.trim() || undefined,
        ctaLabel: editForm.ctaLabel.trim() || undefined,
        ctaHref: editForm.ctaHref.trim() || undefined,
        sortOrder: Number(editForm.sortOrder) || 0,
        active: editForm.active,
        imageUrl,
      }).unwrap()
      cancelEdit()
    } catch (err) {
      setFormError(getErrorMessage(err))
    }
  }

  const handleDelete = async (banner: SiteBanner) => {
    const confirmed = await confirm({
      title: 'Excluir banner',
      description: 'O banner será removido do carrossel da home e a imagem do CDN será apagada.',
      subjectLabel: 'Banner',
      subjectName: banner.title?.trim() || 'Sem título',
      confirmLabel: 'Excluir',
      confirmVariant: 'danger',
      warning: 'Esta ação não pode ser desfeita.',
    })

    if (!confirmed) return
    if (editingId === banner._id) cancelEdit()

    setDeletingId(banner._id)
    try {
      await deleteBanner(banner._id).unwrap()
    } catch {
      // mutation state
    } finally {
      setDeletingId(null)
    }
  }

  const renderFields = (
    form: BannerFormState,
    setForm: (next: BannerFormState) => void,
    disabled: boolean,
  ) => (
    <div className="space-y-4">
      <BannerImageUploader
        value={form.image}
        onChange={(image) => setForm({ ...form, image })}
        disabled={disabled}
        aspectRatio="21:9"
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Input
          label="Título (opcional)"
          placeholder="Ex.: Passe de Batalha EWC 26"
          value={form.title}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Input
          label="Texto do botão (opcional)"
          placeholder="Ex.: Ir para o evento"
          value={form.ctaLabel}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
        />
        <Input
          label="Link do botão (opcional)"
          placeholder="Ex.: /battles ou https://…"
          value={form.ctaHref}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
        />
        <Input
          label="Ordem no carrossel"
          type="number"
          min={0}
          step={1}
          value={form.sortOrder}
          disabled={disabled}
          onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
        />
        <div className="flex items-end pb-1">
          <Checkbox
            label="Ativo na home"
            checked={form.active}
            disabled={disabled}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
        </div>
      </div>
      <Input
        label="Subtítulo (opcional)"
        placeholder="Texto curto abaixo do botão"
        value={form.subtitle}
        disabled={disabled}
        onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
      />
    </div>
  )

  return (
    <div className="space-y-6">
      <PageTitle subtitle="Carrossel widescreen no topo da home (estilo csgo.net). Imagens em JPEG no server (pasta banners).">
        Banners
      </PageTitle>

      <Surface variant="card" className="!p-6">
        <ThemeText as="h2" tone="primary" className="mb-1 text-base font-semibold">
          Novo banner
        </ThemeText>
        <ThemeText as="p" tone="secondary" className="mb-4 text-sm">
          Envie a arte, recorte em 21:9 e defina título/CTA opcionais. A ordem menor aparece
          primeiro.
        </ThemeText>

        <form onSubmit={handleCreate} className="space-y-4">
          {renderFields(createForm, setCreateForm, createState.isLoading)}

          <div className="flex justify-end">
            <Button type="submit" isLoading={createState.isLoading}>
              Criar banner
            </Button>
          </div>
        </form>

        {formError && !editingId ? (
          <ThemeText as="p" tone="danger" className="mt-3 text-sm">
            {formError}
          </ThemeText>
        ) : null}
        {createState.isError ? (
          <ThemeText as="p" tone="danger" className="mt-3 text-sm">
            {getErrorMessage(createState.error)}
          </ThemeText>
        ) : null}
      </Surface>

      <Surface variant="card" className="!p-0">
        {isLoading ? (
          <ThemeText as="p" tone="secondary" className="p-6 text-sm">
            Carregando banners…
          </ThemeText>
        ) : null}

        {isError ? (
          <p className={surfaceClass('errorBanner', 'm-6')}>{getErrorMessage(error)}</p>
        ) : null}

        {!isLoading && !isError && data.length === 0 ? (
          <ThemeText as="p" tone="secondary" className="p-6 text-sm">
            Nenhum banner cadastrado. Enquanto isso a home usa o hero padrão.
          </ThemeText>
        ) : null}

        {!isLoading && data.length > 0 ? (
          <div className={listTable.wrap}>
            <table className={listTable.table}>
              <thead>
                <tr className={listTable.theadRow}>
                  <th className={listTable.th}>Preview</th>
                  <th className={listTable.th}>Título</th>
                  <th className={listTable.th}>Ordem</th>
                  <th className={listTable.th}>Status</th>
                  <th className={listTable.th}>Ações</th>
                </tr>
              </thead>
              <tbody className={listTable.tbody}>
                {data.map((banner) => {
                  const isEditing = editingId === banner._id

                  if (isEditing) {
                    return (
                      <tr key={banner._id} className={listTable.tr}>
                        <td colSpan={5} className={listTable.td}>
                          <div className="space-y-4 py-2">
                            {renderFields(editForm, setEditForm, updateState.isLoading)}
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleSaveEdit(banner._id)}
                                isLoading={updateState.isLoading}
                              >
                                Salvar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={cancelEdit}
                              >
                                Cancelar
                              </Button>
                            </div>
                            {formError && editingId ? (
                              <ThemeText as="p" tone="danger" className="text-sm">
                                {formError}
                              </ThemeText>
                            ) : null}
                            {updateState.isError ? (
                              <ThemeText as="p" tone="danger" className="text-sm">
                                {getErrorMessage(updateState.error)}
                              </ThemeText>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  return (
                    <tr key={banner._id} className={listTable.tr}>
                      <td className={listTable.td}>
                        <img
                          src={banner.imageUrl}
                          alt=""
                          className="h-14 w-28 rounded-lg object-cover"
                        />
                      </td>
                      <td className={listTable.tdStrong}>
                        <ThemeText as="p" tone="primary" className="font-medium">
                          {banner.title?.trim() || 'Sem título'}
                        </ThemeText>
                        {banner.ctaLabel ? (
                          <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                            CTA: {banner.ctaLabel}
                            {banner.ctaHref ? ` → ${banner.ctaHref}` : ''}
                          </ThemeText>
                        ) : null}
                      </td>
                      <td className={listTable.td}>
                        <ThemeText as="span" tone="secondary" className="tabular-nums">
                          {banner.sortOrder}
                        </ThemeText>
                      </td>
                      <td className={listTable.td}>
                        <TextBadge>{banner.active ? 'Ativo' : 'Oculto'}</TextBadge>
                      </td>
                      <td className={listTable.td}>
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          <IconButton
                            type="button"
                            label="Editar banner"
                            onClick={() => startEdit(banner)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </IconButton>
                          <IconButton
                            type="button"
                            label="Excluir banner"
                            variant="danger"
                            disabled={deletingId === banner._id && deleteState.isLoading}
                            onClick={() => handleDelete(banner)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {deleteState.isError ? (
          <p className={surfaceClass('errorBanner', 'm-6')}>
            {getErrorMessage(deleteState.error)}
          </p>
        ) : null}
      </Surface>
    </div>
  )
}
