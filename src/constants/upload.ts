export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

export const ACCEPT_IMAGE_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(',')

export function isAllowedImageType(mimeType: string) {
  return ALLOWED_IMAGE_TYPES.includes(
    mimeType as (typeof ALLOWED_IMAGE_TYPES)[number],
  )
}

export function isAllowedImageFile(file: Pick<File, 'name' | 'type'>) {
  if (isAllowedImageType(file.type)) return true
  return file.type === '' && /\.avif$/i.test(file.name)
}

export const UNSUPPORTED_TYPE_MESSAGE =
  'Tipo de imagem não suportado. Use JPEG, PNG, WebP, GIF ou AVIF.'

export const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGE_FILE_MB = 5
