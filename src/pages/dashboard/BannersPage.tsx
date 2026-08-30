import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
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
import { Modal } from '@/components/ui/Modal'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { TextBadge } from '@/components/StatusPill'
import { ThemeText } from '@/components/ui/ThemeText'
import { PageTitle } from '@/components/ui/Title'
import { listTable } from '@/components/ui/listTable'
import { uploadSingleFile } from '@/lib/upload'
import {
  BANNER_LOCALE_LABELS,
  BANNER_LOCALES,
  useCreateBannerMutation,
  useDeleteBannerMutation,
  useGetBannersQuery,
  useUpdateBannerMutation,
  type BannerLocale,
  type BannerLocaleTextMap,
  type SiteBanner,
} from '@/redux/store/api/banners/api.banners'
import { getErrorMessage } from '@/utils/getErrorMessage'

type LocaleTextMap = Record<BannerLocale, string>

type BannerFormState = {
  eyebrowI18n: LocaleTextMap
  titleI18n: LocaleTextMap
  subtitleI18n: LocaleTextMap
  ctaLabelI18n: LocaleTextMap
  ctaHref: string
  sortOrder: string
  active: boolean
  image: BannerImageValue
}

function emptyLocaleMap(): LocaleTextMap {
  return { 'pt-BR': '', 'en-US': '', 'es-ES': '' }
}

function toLocalePayload(map: LocaleTextMap): BannerLocaleTextMap {
  const result: BannerLocaleTextMap = {}
  for (const locale of BANNER_LOCALES) {
    const value = map[locale].trim()
    if (value) result[locale] = value
  }
  return result
}

function preloadFieldI18n(
  banner: SiteBanner,
  i18nKey: 'eyebrowI18n' | 'titleI18n' | 'subtitleI18n' | 'ctaLabelI18n',
  fallbackKey: 'eyebrow' | 'title' | 'subtitle' | 'ctaLabel',
): LocaleTextMap {
  const i18n = banner[i18nKey]
  const fallback = banner[fallbackKey] ?? ''
  const result = emptyLocaleMap()
  for (const locale of BANNER_LOCALES) {
    result[locale] = i18n?.[locale] ?? (locale === 'pt-BR' ? fallback : '')
  }
  return result
}

function localeFieldLabel(base: string, locale: BannerLocale) {
  return locale === 'pt-BR'
    ? `${base} (${locale})`
    : `${base} (${BANNER_LOCALE_LABELS[locale]})`
}

const emptyForm = (): BannerFormState => ({
  eyebrowI18n: emptyLocaleMap(),
  titleI18n: emptyLocaleMap(),
  subtitleI18n: emptyLocaleMap(),
  ctaLabelI18n: emptyLocaleMap(),
  ctaHref: '',
  sortOrder: '0',
  active: true,
  image: null,
})

function formFromBanner(banner: SiteBanner): BannerFormState {
  return {
    eyebrowI18n: preloadFieldI18n(banner, 'eyebrowI18n', 'eyebrow'),
    titleI18n: preloadFieldI18n(banner, 'titleI18n', 'title'),
    subtitleI18n: preloadFieldI18n(banner, 'subtitleI18n', 'subtitle'),
    ctaLabelI18n: preloadFieldI18n(banner, 'ctaLabelI18n', 'ctaLabel'),
    ctaHref: banner.ctaHref ?? '',
    sortOrder: String(banner.sortOrder ?? 0),
    active: banner.active,
    image: banner.imageUrl,
  }
}

function setLocaleField(
  form: BannerFormState,
  field: 'eyebrowI18n' | 'titleI18n' | 'subtitleI18n' | 'ctaLabelI18n',
  locale: BannerLocale,
  value: string,
): BannerFormState {
  return {
    ...form,
    [field]: { ...form[field], [locale]: value },
  }
}

export default function BannersPage() {
  const { confirm } = useConfirm()
  const { data = [], isLoading, isError, error } = useGetBannersQuery()
  const [createBanner, createState] = useCreateBannerMutation()
  const [updateBanner, updateState] = useUpdateBannerMutation()
  const [deleteBanner, deleteState] = useDeleteBannerMutation()

  const [createForm, setCreateForm] = useState<BannerFormState>(emptyForm)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<BannerFormState>(emptyForm)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const resetCreateForm = () => {
    setCreateForm(emptyForm())
    setFormError(null)
  }

  const openCreateModal = () => {
    resetCreateForm()
    setCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    if (createState.isLoading) return
    setCreateModalOpen(false)
    resetCreateForm()
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
      const uploaded = await uploadSingleFile(image.file, 'banners', {
        crop: image.crop,
      })
      return uploaded.url
    }
    if (typeof image === 'string' && image.trim()) {
      return image.trim()
    }
    return previousUrl
  }

  const buildTextPayload = (form: BannerFormState) => {
    const eyebrowI18n = toLocalePayload(form.eyebrowI18n)
    const titleI18n = toLocalePayload(form.titleI18n)
    const subtitleI18n = toLocalePayload(form.subtitleI18n)
    const ctaLabelI18n = toLocalePayload(form.ctaLabelI18n)

    return {
      eyebrow: form.eyebrowI18n['pt-BR'].trim() || undefined,
      title: form.titleI18n['pt-BR'].trim() || undefined,
      subtitle: form.subtitleI18n['pt-BR'].trim() || undefined,
      ctaLabel: form.ctaLabelI18n['pt-BR'].trim() || undefined,
      eyebrowI18n,
      titleI18n,
      subtitleI18n,
      ctaLabelI18n,
    }
  }

  const submitCreate = async () => {
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
        ...buildTextPayload(createForm),
        ctaHref: createForm.ctaHref.trim() || undefined,
        sortOrder: Number(createForm.sortOrder) || 0,
        active: createForm.active,
        imageUrl,
      }).unwrap()
      setCreateModalOpen(false)
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
        ...buildTextPayload(editForm),
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

  const renderLocaleInputs = (
    form: BannerFormState,
    setForm: (next: BannerFormState) => void,
    disabled: boolean,
    field: 'eyebrowI18n' | 'titleI18n' | 'subtitleI18n' | 'ctaLabelI18n',
    baseLabel: string,
    placeholderPt?: string,
  ) =>
    BANNER_LOCALES.map((locale) => (
      <Input
        key={`${field}-${locale}`}
        label={localeFieldLabel(baseLabel, locale)}
        placeholder={locale === 'pt-BR' ? placeholderPt : undefined}
        value={form[field][locale]}
        disabled={disabled}
        onChange={(e) => setForm(setLocaleField(form, field, locale, e.target.value))}
      />
    ))

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
        {renderLocaleInputs(
          form,
          setForm,
          disabled,
          'eyebrowI18n',
          'Eyebrow',
          'Ex.: Evento, Passe de Batalha',
        )}
        {renderLocaleInputs(
          form,
          setForm,
          disabled,
          'titleI18n',
          'Título',
          'Ex.: Campeonato CS2Club',
        )}
        {renderLocaleInputs(
          form,
          setForm,
          disabled,
          'ctaLabelI18n',
          'Texto do botão',
          'Ex.: Ir para o evento',
        )}
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {renderLocaleInputs(
          form,
          setForm,
          disabled,
          'subtitleI18n',
          'Subtítulo',
          'Texto curto abaixo do botão',
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageTitle subtitle="Carrossel widescreen no topo da home (estilo csgo.net).">
          Banners
        </PageTitle>
        <Button type="button" className="gap-2" onClick={openCreateModal}>
          <Plus className="h-4 w-4" />
          Novo banner
        </Button>
      </div>

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
                        <div className="h-12 w-28 overflow-hidden rounded-lg border border-border bg-surface-secondary">
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className={listTable.tdStrong}>
                        {banner.title?.trim() || 'Sem título'}
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

      <Modal
        open={createModalOpen}
        onOpenChange={(open) => {
          if (!open) closeCreateModal()
          else setCreateModalOpen(true)
        }}
        title="Novo banner"
        description="Envie a arte, recorte em 21:9 e defina título/CTA opcionais nos 3 idiomas. A ordem menor aparece primeiro."
        size="full"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={closeCreateModal}
              disabled={createState.isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={createState.isLoading}
              onClick={() => void submitCreate()}
            >
              Criar banner
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {renderFields(createForm, setCreateForm, createState.isLoading)}
          {formError && !editingId ? (
            <ThemeText as="p" tone="danger" className="text-sm">
              {formError}
            </ThemeText>
          ) : null}
          {createState.isError ? (
            <ThemeText as="p" tone="danger" className="text-sm">
              {getErrorMessage(createState.error)}
            </ThemeText>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}
