import { store } from '@/redux/store/store'

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

export function uploadArenaGameZip(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ ready: boolean; playUrl?: string; originalName?: string }> {
  const token = store.getState().security.accessToken?.trim()
  if (!token) {
    return Promise.reject(new Error('Sessão expirada. Faça login novamente.'))
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${getApiBaseUrl()}/admin/arena/game`)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.responseType = 'json'
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return
      onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response)
        return
      }
      const payload = xhr.response as { message?: string | string[] } | null
      const message = Array.isArray(payload?.message)
        ? payload.message.join(' ')
        : payload?.message
      reject(new Error(message || 'Falha ao enviar o jogo.'))
    }
    xhr.timeout = 0
    xhr.ontimeout = () =>
      reject(new Error('Tempo esgotado ao enviar o jogo. Tente de novo.'))
    xhr.onerror = () =>
      reject(
        new Error(
          'Falha de rede ao enviar o jogo. Em produção o proxy precisa aceitar ~2 GB e um timeout longo.',
        ),
      )
    const body = new FormData()
    body.append('file', file)
    xhr.send(body)
  })
}
