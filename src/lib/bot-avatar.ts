export const BOT_FALLBACK_AVATARS = [
  '/bot/bot1.png',
  '/bot/bot2.png',
  '/bot/bot3.png',
] as const

function hashSeed(seed: string): number {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }
  return hash
}

export function pickBotFallbackAvatar(seed: string): string {
  const index = hashSeed(seed || 'bot') % BOT_FALLBACK_AVATARS.length
  return BOT_FALLBACK_AVATARS[index]
}

export function resolveBotAvatar(
  avatar: string | null | undefined,
  seed: string,
): string {
  const trimmed = avatar?.trim()
  if (trimmed) return trimmed
  return pickBotFallbackAvatar(seed)
}
