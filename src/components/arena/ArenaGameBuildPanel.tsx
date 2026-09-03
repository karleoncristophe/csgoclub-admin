import { useRef, useState } from 'react'
import { FileArchive, Trash2, Upload } from 'lucide-react'
import { StatusPill } from '@/components/StatusPill'
import { Button } from '@/components/ui/Button'
import { useConfirm } from '@/components/ui/ConfirmModalContext'
import { Modal } from '@/components/ui/Modal'
import { Surface } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { uploadArenaGameZip } from '@/lib/uploadArenaGame'
import {
  useDeleteArenaGameMutation,
  useGetArenaGameQuery,
} from '@/redux/store/api/arena/api.arena'
import { getErrorMessage } from '@/utils/getErrorMessage'

function formatBytes(value?: number) {
  if (!value || value <= 0) return null
  if (value >= 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function formatWhen(iso?: string) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function isZipFile(file: File) {
  return (
    file.name.toLowerCase().endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed'
  )
}

export function ArenaGameBuildPanel() {
  const { confirm } = useConfirm()
  const fileRef = useRef<HTMLInputElement>(null)
  const { data, isLoading, refetch } = useGetArenaGameQuery()
  const [removeGame, removeState] = useDeleteArenaGameMutation()
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const pickFile = (file?: File) => {
    if (!file) return
    if (!isZipFile(file)) {
      setError('Envie um arquivo .zip do export WebGL.')
      return
    }
    void handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    setError(null)
    setUploading(true)
    setProgress(0)
    try {
      await uploadArenaGameZip(file, setProgress)
      await refetch()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    const confirmed = await confirm({
      title: 'Remover o jogo da Arena',
      description: 'O Aim Trainer some do site até você enviar outro zip.',
      confirmLabel: 'Remover',
      confirmVariant: 'danger',
    })
    if (!confirmed) return
    setError(null)
    try {
      await removeGame().unwrap()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const meta = [
    data?.originalName,
    formatBytes(data?.zipBytes),
    formatWhen(data?.uploadedAt),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-foreground shadow-sm transition hover:border-accent/50 hover:bg-default"
      >
        <Upload className="h-4 w-4" strokeWidth={2} />
        Jogo
        {data?.ready ? (
          <span
            className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            aria-label="No ar"
          />
        ) : null}
      </button>

      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!next && uploading) return
          setOpen(next)
          if (!next) {
            setError(null)
            setDragActive(false)
          }
        }}
        title="Jogo da Arena"
        description="Aim Trainer que o jogador abre no site. Exporte o WebGL na Unity, compacte a pasta e envie o zip — o novo envio substitui o atual."
        size="md"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />

        {isLoading ? (
          <ThemeText tone="secondary" className="text-sm">
            Carregando…
          </ThemeText>
        ) : data?.ready && !uploading ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <ThemeText as="p" tone="primary" className="text-sm font-medium">
                  No ar
                </ThemeText>
                <StatusPill active />
              </div>
              {meta ? (
                <ThemeText as="p" tone="faint" className="mt-0.5 truncate text-xs">
                  {meta}
                </ThemeText>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                Substituir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={removeState.isLoading}
                onClick={() => void handleRemove()}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault()
              if (!uploading) setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault()
              setDragActive(false)
              if (!uploading) pickFile(event.dataTransfer.files?.[0])
            }}
            className={`flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragActive
                ? 'border-accent bg-accent-soft'
                : 'border-border bg-surface-secondary hover:border-accent/60 hover:bg-default'
            } ${uploading ? 'pointer-events-none' : ''}`}
          >
            {uploading ? (
              <div className="w-full max-w-xs space-y-3">
                <ThemeText tone="primary" className="text-sm font-medium">
                  Enviando… {progress}%
                </ThemeText>
                <div className="h-1.5 overflow-hidden rounded-full bg-default">
                  <div
                    className="h-full rounded-full bg-accent transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-default text-muted">
                  {dragActive ? (
                    <Upload className="h-5 w-5" />
                  ) : (
                    <FileArchive className="h-5 w-5" />
                  )}
                </span>
                <ThemeText tone="primary" className="text-sm font-medium">
                  {dragActive ? 'Solte o zip aqui' : 'Enviar zip do WebGL'}
                </ThemeText>
                <ThemeText tone="faint" className="mt-1 text-xs">
                  Arraste o arquivo ou clique para escolher
                </ThemeText>
              </>
            )}
          </button>
        )}

        {error ? (
          <Surface variant="errorBanner" className="mt-3">
            {error}
          </Surface>
        ) : null}
      </Modal>
    </>
  )
}
