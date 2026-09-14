import {
  isPendingCaseImage,
  type CaseImageValue,
} from '@/components/cases/CaseImageUploader'
import { deleteUploadFile, uploadSingleFile } from '@/lib/upload'

const BOT_AVATAR_FOLDER = 'bots'

export async function uploadBotAvatar(
  image: CaseImageValue,
  previousUrl?: string,
): Promise<string | undefined> {
  if (isPendingCaseImage(image)) {
    const uploaded = await uploadSingleFile(image.file, BOT_AVATAR_FOLDER, {
      crop: image.crop,
    })
    if (previousUrl && previousUrl !== uploaded.url) {
      void deleteUploadFile(previousUrl)
    }
    return uploaded.url
  }
  if (typeof image === 'string' && image.trim()) {
    return image.trim()
  }
  if (image == null && previousUrl) {
    void deleteUploadFile(previousUrl)
    return undefined
  }
  return previousUrl
}

export function formatBotBalance(value: number | undefined) {
  return (value ?? 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
