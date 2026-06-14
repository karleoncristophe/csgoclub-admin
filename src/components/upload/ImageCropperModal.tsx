import { useCallback, useEffect, useRef, useState } from 'react'
import { Crop, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'

export type CropAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '3:1'

type CropOffset = { x: number; y: number }
type CropImage = {
  source: HTMLImageElement | ImageBitmap
  width: number
  height: number
  close?: () => void
}

type ImageCropperModalProps = {
  src: string
  open: boolean
  onClose: () => void
  onCrop: (blob: Blob) => void
  aspectRatio?: CropAspectRatio
  quality?: number
}

function parseAspect(ratio: CropAspectRatio) {
  const [w, h] = ratio.split(':').map(Number)
  return w / h
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function ImageCropperModal({
  src,
  open,
  onClose,
  onCrop,
  aspectRatio = '1:1',
  quality = 0.92,
}: ImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<CropImage | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  const aspect = parseAspect(aspectRatio)
  const CANVAS_W = 480
  const CANVAS_H = Math.round(CANVAS_W / aspect)

  const applyLoadedImage = useCallback((image: CropImage) => {
    imgRef.current?.close?.()
    imgRef.current = image
    const scaleW = CANVAS_W / image.width
    const scaleH = CANVAS_H / image.height
    const coverScale = Math.max(scaleW, scaleH)
    const containScale = Math.min(scaleW, scaleH)
    setZoom(Math.max(1, coverScale / containScale))
    setImgLoaded(true)
  }, [CANVAS_W, CANVAS_H])

  useEffect(() => {
    if (!open) return

    setImgLoaded(false)
    setOffset({ x: 0, y: 0 })
    let cancelled = false

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

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = CANVAS_W
    canvas.height = CANVAS_H

    const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
    const scale = baseScale * zoom
    const drawW = img.width * scale
    const drawH = img.height * scale
    const cx = CANVAS_W / 2
    const cy = CANVAS_H / 2
    const maxOffX = Math.max(0, (drawW - CANVAS_W) / 2)
    const maxOffY = Math.max(0, (drawH - CANVAS_H) / 2)
    const ox = clamp(offset.x, -maxOffX, maxOffX)
    const oy = clamp(offset.y, -maxOffY, maxOffY)
    const imgX = cx - drawW / 2 + ox
    const imgY = cy - drawH / 2 + oy

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.globalAlpha = 0.35
    ctx.drawImage(img.source, imgX, imgY, drawW, drawH)
    ctx.globalAlpha = 1
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, CANVAS_W, CANVAS_H)
    ctx.clip()
    ctx.drawImage(img.source, imgX, imgY, drawW, drawH)
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, CANVAS_W - 2, CANVAS_H - 2)
  }, [zoom, offset, CANVAS_W, CANVAS_H])

  useEffect(() => {
    if (imgLoaded) draw()
  }, [imgLoaded, draw])

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current || !imgRef.current) return
    const img = imgRef.current
    const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
    const scale = baseScale * zoom
    const drawW = img.width * scale
    const drawH = img.height * scale
    const maxOffX = Math.max(0, (drawW - CANVAS_W) / 2)
    const maxOffY = Math.max(0, (drawH - CANVAS_H) / 2)
    const canvas = canvasRef.current
    const cssW = canvas?.getBoundingClientRect().width ?? CANVAS_W
    const pixelRatio = CANVAS_W / cssW
    const dx = (e.clientX - dragStart.current.mx) * pixelRatio
    const dy = (e.clientY - dragStart.current.my) * pixelRatio
    setOffset({
      x: clamp(dragStart.current.ox + dx, -maxOffX, maxOffX),
      y: clamp(dragStart.current.oy + dy, -maxOffY, maxOffY),
    })
  }

  const handleCrop = async () => {
    const img = imgRef.current
    if (!img) return
    setSaving(true)
    try {
      const out = document.createElement('canvas')
      const OUT_W = 1200
      const OUT_H = Math.round(OUT_W / aspect)
      out.width = OUT_W
      out.height = OUT_H
      const ctx = out.getContext('2d')
      if (!ctx) return

      const baseScale = Math.min(CANVAS_W / img.width, CANVAS_H / img.height)
      const scale = baseScale * zoom
      const drawW = img.width * scale
      const drawH = img.height * scale
      const cx = CANVAS_W / 2
      const cy = CANVAS_H / 2
      const maxOffX = Math.max(0, (drawW - CANVAS_W) / 2)
      const maxOffY = Math.max(0, (drawH - CANVAS_H) / 2)
      const ox = clamp(offset.x, -maxOffX, maxOffX)
      const oy = clamp(offset.y, -maxOffY, maxOffY)
      const imgX = cx - drawW / 2 + ox
      const imgY = cy - drawH / 2 + oy
      const scaleOut = OUT_W / CANVAS_W
      ctx.drawImage(
        img.source,
        imgX * scaleOut,
        imgY * scaleOut,
        drawW * scaleOut,
        drawH * scaleOut,
      )

      out.toBlob(
        (blob) => {
          if (blob) onCrop(blob)
          setSaving(false)
          onClose()
        },
        'image/webp',
        quality,
      )
    } catch {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className={surfaceClass('modalBackdrop')} aria-label="Fechar" onClick={onClose} />
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
          <button type="button" onClick={onClose} className={surfaceClass('ghostIconButton')} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <ThemeText tone="secondary" className="text-center text-xs">
            Arraste para reposicionar e use o zoom para ajustar o enquadramento.
          </ThemeText>
          <div className="mx-auto w-full max-w-[480px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
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
                setZoom((z) => clamp(z - e.deltaY * 0.001, 1, 4))
              }}
            />
          </div>
          <div className="mx-auto flex max-w-sm items-center gap-3">
            <button type="button" onClick={() => setZoom((z) => clamp(z - 0.1, 1, 4))} className={surfaceClass('ghostIconButton')}>
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
            <button type="button" onClick={() => setZoom((z) => clamp(z + 0.1, 1, 4))} className={surfaceClass('ghostIconButton')}>
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1)
                setOffset({ x: 0, y: 0 })
              }}
              className={surfaceClass('ghostIconButton')}
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
