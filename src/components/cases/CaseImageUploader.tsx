import { useCallback, useEffect, useRef, useState } from 'react'
import { Crop, ImagePlus, X } from 'lucide-react'
import { ImageCropperModal } from '@/components/upload/ImageCropperModal'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  ACCEPT_IMAGE_ATTRIBUTE,
  isAllowedImageFile,
  MAX_IMAGE_FILE_BYTES,
  MAX_IMAGE_FILE_MB,
  UNSUPPORTED_TYPE_MESSAGE,
} from '@/constants/upload'

export type PendingCaseImage = {
  _pending: true
  file: File
  id: string
}

export type CaseImageValue = string | PendingCaseImage | null

export function isPendingCaseImage(value: CaseImageValue): value is PendingCaseImage {
  return value != null && typeof value !== 'string' && '_pending' in value
}

function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `case-img-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

type CaseImageUploaderProps = {
  value: CaseImageValue
  onChange: (value: CaseImageValue) => void
  disabled?: boolean
  label?: string
  description?: string
}

export function CaseImageUploader({
  value,
  onChange,
  disabled = false,
  label = 'Capa da caixa',
  description = 'Arraste uma imagem ou clique para enviar. Recomendado 1:1.',
}: CaseImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState(false)
  const [typeError, setTypeError] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)

  const hasImage = value != null
  const preview = isPendingCaseImage(value)
    ? previewUrl
    : typeof value === 'string'
      ? value
      : null

  const cropSrc = isPendingCaseImage(value) ? previewUrl : typeof value === 'string' ? value : null

  useEffect(() => {
    if (!isPendingCaseImage(value)) {
      setPreviewUrl(null)
      return () => {}
    }
    const url = URL.createObjectURL(value.file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [value])

  const addFile = (file: File) => {
    if (!isAllowedImageFile(file)) {
      setTypeError(true)
      setSizeError(false)
      return
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      setSizeError(true)
      setTypeError(false)
      return
    }
    setSizeError(false)
    setTypeError(false)
    onChange({ _pending: true, file, id: generateId() })
  }

  const handleCropDone = useCallback(
    (blob: Blob) => {
      const extension = blob.type === 'image/webp' ? 'webp' : 'png'
      const file = new File([blob], `case-cover.${extension}`, {
        type: blob.type || 'image/png',
      })
      onChange({ _pending: true, file, id: generateId() })
      setCropOpen(false)
    },
    [onChange],
  )

  return (
    <div className="space-y-2">
      <ThemeText tone="label" className="text-sm font-medium">
        {label}
      </ThemeText>
      {description ? (
        <ThemeText tone="secondary" className="text-xs">
          {description}
        </ThemeText>
      ) : null}

      <div className="flex flex-wrap items-start gap-4">
        <div
          role="button"
          tabIndex={0}
          onDrop={(e) => {
            e.preventDefault()
            setDragActive(false)
            if (disabled) return
            const file = e.dataTransfer.files?.[0]
            if (file) addFile(file)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!disabled) inputRef.current?.click()
            }
          }}
          onClick={() => {
            if (!disabled) inputRef.current?.click()
          }}
          className={`flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors ${
            dragActive
              ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-950/30'
              : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600'
          } ${disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_IMAGE_ATTRIBUTE}
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) addFile(file)
              e.target.value = ''
            }}
          />
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 px-3 text-center">
              <ImagePlus className="h-8 w-8 text-zinc-400" />
              <ThemeText tone="faint" className="text-xs">
                Enviar capa
              </ThemeText>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          {hasImage && !disabled && cropSrc ? (
            <button
              type="button"
              onClick={() => setCropOpen(true)}
              className="inline-flex items-center gap-2 text-sm text-brand-700 hover:underline dark:text-brand-400"
            >
              <Crop className="h-4 w-4" />
              Recortar
            </button>
          ) : null}
          {hasImage && !disabled ? (
            <button
              type="button"
              onClick={() => {
                setSizeError(false)
                setTypeError(false)
                onChange(null)
              }}
              className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline dark:text-red-400"
            >
              <X className="h-4 w-4" />
              Remover
            </button>
          ) : null}
        </div>
      </div>

      {typeError ? (
        <Surface variant="errorBanner" className="!p-3 text-xs">
          {UNSUPPORTED_TYPE_MESSAGE}
        </Surface>
      ) : null}
      {sizeError ? (
        <Surface variant="errorBanner" className="!p-3 text-xs">
          A imagem tem mais de {MAX_IMAGE_FILE_MB} MB.
        </Surface>
      ) : null}

      {cropOpen && cropSrc ? (
        <ImageCropperModal
          src={cropSrc}
          open={cropOpen}
          onClose={() => setCropOpen(false)}
          onCrop={handleCropDone}
          aspectRatio="1:1"
        />
      ) : null}
    </div>
  )
}
