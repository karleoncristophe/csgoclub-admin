import { store } from '@/redux/store/store'
import { ADMIN_DATA_ENVIRONMENT_HEADER } from '@/utils/platformDataEnvironmentStorage'

/** Stay under default nginx `client_max_body_size 1m` including multipart overhead. */
const CHUNK_SIZE = 768 * 1024
const CONCURRENCY = 4
const COMMIT_POLL_MS = 2000
const COMMIT_WAIT_MS = 3 * 60 * 1000

type ArenaGameUploadResult = {
  ready: boolean
  playUrl?: string
  originalName?: string
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

function authHeaders(json = false): HeadersInit {
  const state = store.getState()
  const token = state.security.accessToken?.trim()
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    [ADMIN_DATA_ENVIRONMENT_HEADER]:
      state.platformDataEnvironment?.value ?? 'PRODUCTION',
  }
  if (json) headers.Accept = 'application/json'
  return headers
}

function errorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback
  const message = (payload as { message?: string | string[] }).message
  if (Array.isArray(message)) return message.join(' ')
  return message?.trim() || fallback
}

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null)
  return new Error(errorMessage(payload, fallback))
}

async function postChunk(input: {
  uploadId: string
  index: number
  total: number
  originalName: string
  totalBytes: number
  blob: Blob
}) {
  const body = new FormData()
  body.set('uploadId', input.uploadId)
  body.set('index', String(input.index))
  body.set('total', String(input.total))
  body.set('originalName', input.originalName)
  body.set('totalBytes', String(input.totalBytes))
  body.set('file', input.blob, `part-${input.index}.bin`)

  const response = await fetch(`${getApiBaseUrl()}/admin/arena/game/chunk`, {
    method: 'POST',
    headers: authHeaders(),
    body,
  })
  if (!response.ok) {
    throw await readError(response, 'Falha ao enviar um pedaço do jogo.')
  }
}

async function commitUpload(uploadId: string): Promise<ArenaGameUploadResult> {
  const response = await fetch(`${getApiBaseUrl()}/admin/arena/game/commit`, {
    method: 'POST',
    headers: {
      ...authHeaders(true),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uploadId }),
  })
  if (!response.ok) {
    throw await readError(response, 'Falha ao montar o jogo.')
  }
  return (await response.json()) as ArenaGameUploadResult
}

async function fetchGameStatus(): Promise<ArenaGameUploadResult | null> {
  const response = await fetch(`${getApiBaseUrl()}/admin/arena/game`, {
    headers: authHeaders(true),
  })
  if (!response.ok) return null
  return (await response.json()) as ArenaGameUploadResult
}

async function waitForPublished(
  originalName: string,
  startedAt: number,
): Promise<ArenaGameUploadResult | null> {
  while (Date.now() - startedAt < COMMIT_WAIT_MS) {
    const status = await fetchGameStatus()
    if (status?.ready && status.originalName === originalName) {
      return status
    }
    await new Promise((resolve) => window.setTimeout(resolve, COMMIT_POLL_MS))
  }
  return null
}

export async function uploadArenaGameZip(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ArenaGameUploadResult> {
  authHeaders()
  if (!file.name.toLowerCase().endsWith('.zip')) {
    throw new Error('Envie um arquivo .zip do export WebGL.')
  }

  const uploadId = crypto.randomUUID()
  const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE))
  const indexes = Array.from({ length: total }, (_, index) => index)
  let completed = 0

  const report = (percent: number) => onProgress?.(Math.min(99, percent))

  const worker = async () => {
    while (indexes.length > 0) {
      const index = indexes.shift()
      if (index == null) return
      const start = index * CHUNK_SIZE
      const blob = file.slice(start, start + CHUNK_SIZE)
      await postChunk({
        uploadId,
        index,
        total,
        originalName: file.name,
        totalBytes: file.size,
        blob,
      })
      completed += 1
      report(Math.round((completed / total) * 90))
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, total) }, () => worker()),
  )

  report(92)
  const startedAt = Date.now()
  try {
    const published = await commitUpload(uploadId)
    report(100)
    return published
  } catch (error) {
    const published = await waitForPublished(file.name, startedAt)
    if (published) {
      report(100)
      return published
    }
    try {
      const retried = await commitUpload(uploadId)
      report(100)
      return retried
    } catch {
      throw error instanceof Error
        ? error
        : new Error('Falha ao montar o jogo.')
    }
  }
}
