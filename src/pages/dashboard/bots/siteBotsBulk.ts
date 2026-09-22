import type { AdminSiteBot } from '@/redux/store/api/site-bots/api.site-bots'

export const BULK_IMPORT_MAX_NAMES = 1000
export const BULK_AVATAR_MAX_FILES = 100
export const BULK_AVATAR_MAX_BYTES = 10 * 1024 * 1024
export const BULK_AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

/** Aceita um nick por linha, vírgula ou ponto e vírgula; normaliza espaços. */
export function parseBulkNicknames(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.normalize('NFKC').trim().replace(/\s+/g, ' '))
    .filter((part) => part.length > 0)
}

/** Uma linha por bot selecionado; linhas vazias ficam vazias para não deslocar o restante. */
export function parseBulkRenameLines(raw: string): string[] {
  return raw.split(/\n/).map((part) => part.normalize('NFKC').trim().replace(/\s+/g, ' '))
}

export function normalizeBotKey(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

export function filenameToNickKey(filename: string): string {
  const base = filename.replace(/^.*[/\\]/, '').replace(/\.[^.]+$/, '')
  return normalizeBotKey(base)
}

export type BulkImportPreviewRow = {
  name: string
  status: 'ok' | 'invalid' | 'duplicate_in_request' | 'already_exists'
}

export function previewBulkNicknames(
  names: string[],
  existingNames: Iterable<string>,
): BulkImportPreviewRow[] {
  const taken = new Set([...existingNames].map((name) => name.toLowerCase()))
  const seen = new Set<string>()
  return names.map((name) => {
    const key = name.toLowerCase()
    if (name.length < 2 || name.length > 32) return { name, status: 'invalid' }
    if (seen.has(key)) return { name, status: 'duplicate_in_request' }
    seen.add(key)
    if (taken.has(key)) return { name, status: 'already_exists' }
    return { name, status: 'ok' }
  })
}

export const BULK_STATUS_LABEL: Record<BulkImportPreviewRow['status'], string> = {
  ok: 'Será criado',
  invalid: 'Inválido (2–32 caracteres)',
  duplicate_in_request: 'Repetido na lista',
  already_exists: 'Já existe',
}

export type BulkRenamePreviewRow = {
  id: string
  currentName: string
  name: string
  status:
    | 'ok'
    | 'invalid'
    | 'duplicate_in_request'
    | 'already_exists'
    | 'unchanged'
    | 'missing'
}

export const BULK_RENAME_STATUS_LABEL: Record<BulkRenamePreviewRow['status'], string> = {
  ok: 'Vai atualizar',
  invalid: 'Inválido (2–32 caracteres)',
  duplicate_in_request: 'Repetido na lista',
  already_exists: 'Já existe',
  unchanged: 'Igual ao atual',
  missing: 'Sem nick novo',
}

export function previewBulkRename(
  selected: AdminSiteBot[],
  names: string[],
  allBots: AdminSiteBot[],
): BulkRenamePreviewRow[] {
  const batchIds = new Set(selected.map((bot) => bot._id))
  const taken = new Set(
    allBots
      .filter((bot) => !batchIds.has(bot._id))
      .map((bot) => (bot.nameKey || bot.name).toLowerCase()),
  )
  const seen = new Set<string>()
  return selected.map((bot, index) => {
    const name = names[index] ?? ''
    const key = name.toLowerCase()
    const currentKey = (bot.nameKey || bot.name).toLowerCase()
    if (!name) {
      return { id: bot._id, currentName: bot.name, name, status: 'missing' }
    }
    if (name.length < 2 || name.length > 32) {
      return { id: bot._id, currentName: bot.name, name, status: 'invalid' }
    }
    if (key === currentKey) {
      return { id: bot._id, currentName: bot.name, name, status: 'unchanged' }
    }
    if (seen.has(key)) {
      return { id: bot._id, currentName: bot.name, name, status: 'duplicate_in_request' }
    }
    seen.add(key)
    if (taken.has(key)) {
      return { id: bot._id, currentName: bot.name, name, status: 'already_exists' }
    }
    return { id: bot._id, currentName: bot.name, name, status: 'ok' }
  })
}

export function matchFileToBot(
  filename: string,
  bots: AdminSiteBot[],
  usedIds?: Set<string>,
): AdminSiteBot | undefined {
  const key = filenameToNickKey(filename)
  if (!key) return undefined
  return bots.find((bot) => {
    if (usedIds?.has(bot._id)) return false
    return normalizeBotKey(bot.nameKey || bot.name) === key
  })
}

export function validateAvatarFiles(files: File[]): string | null {
  if (files.length === 0) return 'Selecione ao menos uma imagem.'
  if (files.length > BULK_AVATAR_MAX_FILES) {
    return `Envie no máximo ${BULK_AVATAR_MAX_FILES} fotos por lote.`
  }
  if (
    files.some(
      (file) =>
        !BULK_AVATAR_TYPES.includes(file.type as (typeof BULK_AVATAR_TYPES)[number]) ||
        file.size > BULK_AVATAR_MAX_BYTES,
    )
  ) {
    return 'Use PNG, JPEG ou WebP, com até 10 MB por arquivo.'
  }
  return null
}

export function botHasAvatar(bot: AdminSiteBot): boolean {
  return Boolean(bot.avatarUrl?.trim())
}
