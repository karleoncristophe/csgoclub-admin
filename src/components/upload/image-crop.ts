export type CropAspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '3:1' | '21:9'

export type ImageCropRect = {
  left: number
  top: number
  width: number
  height: number
}

export type CropOffset = { x: number; y: number }

export function parseAspect(ratio: CropAspectRatio) {
  const [w, h] = ratio.split(':').map(Number)
  return w / h
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Cover / contain — at this zoom the image always fills the frame (Uppass). */
export function computeCoverZoom(
  imgWidth: number,
  imgHeight: number,
  canvasW: number,
  canvasH: number,
) {
  const scaleW = canvasW / imgWidth
  const scaleH = canvasH / imgHeight
  const containScale = Math.min(scaleW, scaleH)
  const coverScale = Math.max(scaleW, scaleH)
  return coverScale / containScale
}

export function computeSourceCrop(params: {
  imgWidth: number
  imgHeight: number
  canvasW: number
  canvasH: number
  zoom: number
  offset: CropOffset
}): ImageCropRect {
  const { imgWidth, imgHeight, canvasW, canvasH, zoom, offset } = params
  const baseScale = Math.min(canvasW / imgWidth, canvasH / imgHeight)
  const scale = baseScale * zoom
  const drawW = imgWidth * scale
  const drawH = imgHeight * scale
  const maxOffX = Math.max(0, (drawW - canvasW) / 2)
  const maxOffY = Math.max(0, (drawH - canvasH) / 2)
  const ox = clamp(offset.x, -maxOffX, maxOffX)
  const oy = clamp(offset.y, -maxOffY, maxOffY)
  const imgX = canvasW / 2 - drawW / 2 + ox
  const imgY = canvasH / 2 - drawH / 2 + oy
  const sourceWidth = Math.min(imgWidth, canvasW / scale)
  const sourceHeight = Math.min(imgHeight, canvasH / scale)
  return {
    left: clamp(-imgX / scale, 0, Math.max(0, imgWidth - sourceWidth)),
    top: clamp(-imgY / scale, 0, Math.max(0, imgHeight - sourceHeight)),
    width: sourceWidth,
    height: sourceHeight,
  }
}

export function toIntegerCrop(crop: ImageCropRect): ImageCropRect {
  return {
    left: Math.round(crop.left),
    top: Math.round(crop.top),
    width: Math.max(1, Math.round(crop.width)),
    height: Math.max(1, Math.round(crop.height)),
  }
}
