import { Link } from 'react-router-dom'

const SIZE_CLASS = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-12 w-12 text-sm',
  lg: 'h-14 w-14 text-lg',
} as const

type UserAvatarLinkProps = {
  userId?: string | null
  name?: string | null
  avatar?: string | null
  size?: keyof typeof SIZE_CLASS
  className?: string
}

export function UserAvatarLink({
  userId,
  name,
  avatar,
  size = 'md',
  className = '',
}: UserAvatarLinkProps) {
  const dim = SIZE_CLASS[size]
  const initial = name?.trim()?.[0]?.toUpperCase() || '?'
  const photo = avatar?.trim() || ''

  const face = photo ? (
    <img
      src={photo}
      alt={name || 'Avatar'}
      className={`${dim} shrink-0 rounded-full bg-zinc-200 object-cover ring-2 ring-white dark:bg-zinc-800 dark:ring-zinc-900 ${className}`.trim()}
    />
  ) : (
    <span
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold text-zinc-600 ring-2 ring-white dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-900 ${className}`.trim()}
    >
      {initial}
    </span>
  )

  if (!userId) return face

  return (
    <Link
      to={`/dashboard/users/${userId}`}
      title={name ? `Perfil de ${name}` : 'Perfil do usuário'}
      className="shrink-0 rounded-full transition hover:opacity-90"
      onClick={(event) => event.stopPropagation()}
    >
      {face}
    </Link>
  )
}
