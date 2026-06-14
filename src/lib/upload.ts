import { store } from '@/redux/store/store'

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

export type UploadSingleResponse = {
  url: string
  filename?: string
  size?: number
}

export async function uploadSingleFile(
  file: File,
  folder = 'cases',
  customName?: string,
): Promise<UploadSingleResponse> {
  const token = store.getState().security.accessToken?.trim()
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const formData = new FormData()
  formData.append('file', file)
  if (folder) formData.set('folder', folder)
  if (customName) formData.set('customName', customName)

  const res = await fetch(`${getApiBaseUrl()}/upload/single`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })

  if (!res.ok) {
    const text = await res.text()
    let message = 'Falha no upload da imagem.'
    try {
      const json = JSON.parse(text) as { message?: string }
      if (json.message) message = json.message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }

  return (await res.json()) as UploadSingleResponse
}

export async function deleteUploadFile(url: string) {
  const token = store.getState().security.accessToken?.trim()
  if (!token || !url?.trim()) return

  await fetch(`${getApiBaseUrl()}/upload/file`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: url.trim() }),
  })
}
