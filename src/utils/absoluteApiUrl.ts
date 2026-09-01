export function getAdminApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
}

export function absoluteApiUrl(path: string): string {
  const base = getAdminApiBaseUrl()
  const suffix = path.startsWith('/') ? path : `/${path}`
  if (!base) return suffix
  return `${base}${suffix}`
}

export function isPublicHttpsApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    return host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local')
  } catch {
    return false
  }
}
