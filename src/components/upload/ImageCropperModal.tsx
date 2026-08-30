import { useCallback, useEffect, useRef, useState } from 'react'
import { Crop, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import {
  clamp,
  computeCoverZoom,
  computeSourceCrop,
  parseAspect,
  toIntegerCrop,
  type CropAspectRatio,
  type CropOffset,
  type ImageCropRect,
} from '@/components/upload/image-crop'

export type { CropAspectRatio, ImageCropRect }

type CropImage = {
  source: HTMLImageElement | ImageBitmap
  width: number
  height: number
  close?: () => void
}

export type CropResult = {
  blob: Blob
  crop: ImageCropRect
}

type ImageCropperModalProps = {
  src: string
  open: boolean
  onClose: () => void
  onCrop: (result: CropResult) => void
  aspectRatio?: CropAspectRatio
  quality?: number
  outputWidth?: number
}

const ZOOM_MAX = 4

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/webp' | 'image/png',
  quality?: number,
) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality)
  })
}

export function ImageCropperModal({
  src,
  open,
  onClose,
  onCrop,
  aspectRatio = '1:1',
  quality = 1,
  outputWidth = 1600,
}: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<CropImage | null>(null)
  const [zoom, setZoom] = useState(1)
  const [minZoom, setMinZoom] = useState(1)
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(
    null,
  )
  const [imgLoaded, setImgLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  const aspect = parseAspect(aspectRatio)
  const CANVAS_W = 480
  const CANVAS_H = Math.round(CANVAS_W / aspect)

  const applyLoadedImage = useCallback(
    (image: CropImage) => {
      imgRef.current?.close?.()
      imgRef.current = image
      const coverZoom = computeCoverZoom(image.width, image.height, CANVAS_W, CANVAS_H)
      setMinZoom(coverZoom)
      setZoom(coverZoom)
      setOffset({ x: 0, y: 0 })
      setImgLoaded(true)
    },
    [CANVAS_W, CANVAS_H],
  )

  useEffect(() => {
    if (!open) return

    setImgLoaded(false)
    setOffset({ x: 0, y: 0 })
    setMinZoom(1)
    setZoom(1)
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(src, { cache: 'force-cache' })
        if (!res.ok) throw new Error('Falha ao carregar imagem para recorte.')
        if (cancelled) return
        const blob = await res.blob()
        if (cancelled) return

        if ('createImageBitmap' in window) {
          const bitmap = await createImageBitmap(blob)
          if (cancelled) {
            bitmap.close()
            return
          }
          applyLoadedImage({
            source: bitmap,
            width: bitmap.width,
            height: bitmap.height,
            close: () => bitmap.close(),
          })
          return
        }

        const objectUrl = URL.createObjectURL(blob)
        const img = document.createElement('img')
        img.onload = async () => {
          if (cancelled) return
          try {
            await img.decode?.()
          } catch {
            // ignore
          }
          if (cancelled) return
          applyLoadedImage({
            source: img,
            width: img.naturalWidth,
            height: img.naturalHeight,
            close: () => URL.revokeObjectURL(objectUrl),
          })
        }
        img.onerror = () => URL.revokeObjectURL(objectUrl)
        img.src = objectUrl
      } catch {
        if (cancelled) return
        const img = document.createElement('img')
        img.crossOrigin = 'anonymous'
        img.onload = async () => {
          if (cancelled) return
          try {
            await img.decode?.()
          } catch {
            // ignore
          }
          if (cancelled) return
          applyLoadedImage({
            source: img,
            width: img.naturalWidth,
            height: img.naturalHeight,
          })
        }
        img.onerror = () => {
          if (!cancelled) setImgLoaded(false)
        }
        img.src = src
      }
    }

    void load()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      cancelled = true
      imgRef.current?.close?.()
      imgRef.current = null
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [src, open, applyLoadedImage, onClose])

  const getLayout = useCallback(() => {
    const img = imgRef.current
    if (!img) return null
    const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
    const scale = baseScale * zoom
    const drawW = img.width * scale
    const drawH = img.height * scale
    const maxOffX = Math.max(0, (drawW - CANVAS_W) / 2)
    const maxOffY = Math.max(0, (drawH - CANVAS_H) / 2)
    const ox = clamp(offset.x, -maxOffX, maxOffX)
    const oy = clamp(offset.y, -maxOffY, maxOffY)
    return {
      img,
      drawW,
      drawH,
      maxOffX,
      maxOffY,
      imgX: CANVAS_W / 2 - drawW / 2 + ox,
      imgY: CANVAS_H / 2 - drawH / 2 + oy,
    }
  }, [zoom, offset, CANVAS_W, CANVAS_H])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const layout = getLayout()
    if (!canvas || !layout) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    canvas.width = CANVAS_W
    canvas.height = CANVAS_H

    const { img, drawW, drawH, imgX, imgY } = layout
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.globalAlpha = 0.3
    ctx.drawImage(img.source, imgX, imgY, drawW, drawH)
    ctx.globalAlpha = 1
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_W, CANVAS_H)
    ctx.clip()
    ctx.drawImage(img.source, imgX, imgY, drawW, drawH)
    ctx.restore()

    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 2; i += 1) {
      const x = (CANVAS_W / 3) * i
      const y = (CANVAS_H / 3) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, CANVAS_H)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(CANVAS_W, y)
      ctx.stroke()
    }
  }, [getLayout, CANVAS_W, CANVAS_H])

  useEffect(() => {
    setZoom((current) => clamp(current, minZoom, ZOOM_MAX))
  }, [minZoom])

  useEffect(() => {
    if (imgLoaded) draw()
  }, [imgLoaded, draw])

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
    const scale = baseScale * zoom
    const drawW = img.width * scale
    const drawH = img.height * scale
    const maxOffX = Math.max(0, (drawW - CANVAS_W) / 2)
    const maxOffY = Math.max(0, (drawH - CANVAS_H) / 2)
    setOffset((prev) => ({
      x: clamp(prev.x, -maxOffX, maxOffX),
      y: clamp(prev.y, -maxOffY, maxOffY),
    }))
  }, [zoom, CANVAS_W, CANVAS_H])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current) return
    const layout = getLayout()
    if (!layout) return
    const canvas = canvasRef.current
    const cssW = canvas?.getBoundingClientRect().width ?? CANVAS_W
    const pixelRatio = CANVAS_W / cssW
    const dx = (e.clientX - dragStart.current.mx) * pixelRatio
    const dy = (e.clientY - dragStart.current.my) * pixelRatio
    setOffset({
      x: clamp(dragStart.current.ox + dx, -layout.maxOffX, layout.maxOffX),
      y: clamp(dragStart.current.oy + dy, -layout.maxOffY, layout.maxOffY),
    })
  }

  const handleCrop = async () => {
    const img = imgRef.current
    if (!img) return
    setSaving(true)
    try {
      const source = computeSourceCrop({
        imgWidth: img.width,
        imgHeight: img.height,
        canvasW: CANVAS_W,
        canvasH: CANVAS_H,
        zoom,
        offset,
      })
      const crop = toIntegerCrop(source)
      const OUT_W = Math.max(1, Math.min(outputWidth, Math.floor(source.width)))
      const OUT_H = Math.max(1, Math.round(OUT_W / aspect))

      const out = document.createElement('canvas')
      out.width = OUT_W
      out.height = OUT_H
      const ctx = out.getContext('2d', { alpha: true })
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(
        img.source,
        source.left,
        source.top,
        source.width,
        source.height,
        0,
        0,
        OUT_W,
        OUT_H,
      )

      const blob =
        (await canvasToBlob(out, 'image/webp', Math.max(0.98, quality))) ??
        (await canvasToBlob(out, 'image/png'))
      if (blob) onCrop({ blob, crop })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className={surfaceClass('modalBackdrop')}
        aria-label="Fechar"
        onClick={onClose}
      />
      <Surface variant="modalShell" className="max-w-xl">
        <div className={surfaceClass('modalHeaderRow')}>
          <div className="flex items-center gap-2">
            <Crop className="h-4 w-4" />
            <ThemeText tone="primary" className="font-semibold">
              Recortar imagem
            </ThemeText>
            <ThemeText tone="label" className="text-xs">
              {aspectRatio}
            </ThemeText>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={surfaceClass('ghostIconButton')}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <ThemeText tone="secondary" className="text-center text-xs">
            Arraste para reposicionar. O recorte final é aplicado no servidor, na
            resolução original.
          </ThemeText>
          <div
            className="mx-auto w-full max-w-[480px] overflow-hidden rounded-xl border border-separator"
            style={{
              backgroundColor: '#d4d4d8',
              backgroundImage:
                'linear-gradient(45deg, #a1a1aa 25%, transparent 25%), linear-gradient(-45deg, #a1a1aa 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #a1a1aa 75%), linear-gradient(-45deg, transparent 75%, #a1a1aa 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className={`w-full touch-none select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              onWheel={(e) => {
                e.preventDefault()
                setZoom(clamp(zoom - e.deltaY * 0.001, minZoom, ZOOM_MAX))
              }}
            />
          </div>
          <div className="mx-auto flex max-w-sm items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom(clamp(zoom - 0.1, minZoom, ZOOM_MAX))}
              disabled={zoom <= minZoom + 0.001}
              className={surfaceClass('ghostIconButton')}
              aria-label="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={minZoom}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(clamp(Number(e.target.value), minZoom, ZOOM_MAX))}
              className="flex-1"
              aria-label="Zoom"
            />
            <button
              type="button"
              onClick={() => setZoom(clamp(zoom + 0.1, minZoom, ZOOM_MAX))}
              disabled={zoom >= ZOOM_MAX}
              className={surfaceClass('ghostIconButton')}
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(minZoom)
                setOffset({ x: 0, y: 0 })
              }}
              className={surfaceClass('ghostIconButton')}
              aria-label="Resetar enquadramento"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={surfaceClass('modalFooterRow')}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleCrop()} isLoading={saving}>
            Aplicar recorte
          </Button>
        </div>
      </Surface>
    </div>
  )
}
