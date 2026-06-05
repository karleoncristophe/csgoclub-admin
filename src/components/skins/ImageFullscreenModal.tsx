import { useEffect } from 'react'
import { X } from 'lucide-react'

type ImageFullscreenModalProps = {
  open: boolean
  src: string
  alt: string
  onClose: () => void
}

export function ImageFullscreenModal({
  open,
  src,
  alt,
  onClose,
}: ImageFullscreenModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização: ${alt}`}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/50 p-2 text-white transition hover:bg-white/10"
        aria-label="Fechar visualização"
      >
        <X className="h-5 w-5" />
      </button>

      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[min(96vw,1200px)] object-contain drop-shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  )
}
