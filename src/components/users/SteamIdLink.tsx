import type { MouseEvent } from 'react'
import { ExternalLink } from 'lucide-react'

export function steamCommunityProfileUrl(steamId: string) {
  return `https://steamcommunity.com/profiles/${encodeURIComponent(steamId.trim())}`
}

export function SteamIdLink({
  steamId,
  className = '',
}: {
  steamId?: string | null
  className?: string
}) {
  const id = steamId?.trim()
  if (!id) return null

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation()
  }

  return (
    <a
      href={steamCommunityProfileUrl(id)}
      target="_blank"
      rel="noreferrer"
      title="Abrir perfil na Steam"
      onClick={handleClick}
      className={`inline-flex max-w-full items-center gap-1 font-mono text-[10px] text-brand-600 hover:underline dark:text-brand-400 ${className}`.trim()}
    >
      <span className="truncate">{id}</span>
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </a>
  )
}
