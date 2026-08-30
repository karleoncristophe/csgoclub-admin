import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { StatusPill, TextBadge } from '@/components/StatusPill'
import { UserCaseOpensPanel } from '@/components/users/UserCaseOpensPanel'
import { UserArenaCrateOpensPanel } from '@/components/users/UserArenaCrateOpensPanel'
import { UserEditPanel } from '@/components/users/UserEditPanel'
import { UserKycPanel } from '@/components/users/UserKycPanel'
import { UserSiteInventoryPanel } from '@/components/users/UserSiteInventoryPanel'
import { UserWalletPanel } from '@/components/users/UserWalletPanel'
import { steamCommunityProfileUrl } from '@/components/users/SteamIdLink'
import { labelUserAppRole } from '@/i18n/enumLabels'
import { useGetUserByIdQuery } from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'

function formatDateTime(value?: string, style: 'short' | 'long' = 'short') {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: style === 'long' ? 'full' : 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatRelative(value?: string) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const diffMs = date.getTime() - Date.now()
  const absSec = Math.round(Math.abs(diffMs) / 1000)
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), 'second')
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60000), 'minute')
  if (absSec < 86400) return rtf.format(Math.round(diffMs / 3600000), 'hour')
  return rtf.format(Math.round(diffMs / 86400000), 'day')
}

function CopyableField({
  label,
  value,
  mono = true,
  href,
}: {
  label: string
  value?: string
  mono?: boolean
  href?: string
}) {
  const [copied, setCopied] = useState(false)

  if (!value) return null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-xl border border-separator bg-surface-secondary px-3 py-2.5">
      <ThemeText as="p" tone="label" className="text-[10px] uppercase tracking-wide">
        {label}
      </ThemeText>
      <div className="mt-1 flex items-center justify-between gap-2">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`min-w-0 truncate text-sm text-brand-600 hover:underline dark:text-brand-400 ${
              mono ? 'font-mono text-xs' : 'font-medium'
            }`}
          >
            {value}
          </a>
        ) : (
          <ThemeText
            as="p"
            tone="primary"
            className={`min-w-0 truncate text-sm ${mono ? 'font-mono text-xs' : 'font-medium'}`}
          >
            {value}
          </ThemeText>
        )}
        <div className="flex shrink-0 items-center gap-0.5">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Abrir ${label}`}
              className="rounded-md p-1.5 text-muted transition hover:bg-default hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md p-1.5 text-muted transition hover:bg-default hover:text-foreground"
            aria-label={`Copiar ${label}`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UserDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error, refetch } = useGetUserByIdQuery(id, {
    skip: !id,
  })

  const isInfluencer =
    data?.userType === 'influencer' || Boolean(data?.isTestAffiliate)

  if (!id) {
    return (
      <div className="space-y-4">
        <Link
          to="/dashboard/users"
          className="inline-flex items-center gap-2 text-sm text-brand-600 hover:underline dark:text-brand-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à listagem
        </Link>
        <ThemeText as="p" tone="secondary">
          ID do usuário não informado.
        </ThemeText>
      </div>
    )
  }

  const avatar = data?.avatarFull ?? data?.avatarMedium ?? data?.avatar
  const lastLoginRelative = formatRelative(data?.lastLoginAt)
  const createdRelative = formatRelative(data?.createdAt)

  return (
    <div className="space-y-4">
      <Link
        to="/dashboard/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à listagem
      </Link>

      {isLoading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Carregando perfil do usuário...
        </div>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data ? (
        <>
          <Surface variant="settingsPanel" className="!p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {avatar ? (
                  <img
                    src={avatar}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-full border border-separator object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                    {data.name?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
                      {data.name}
                    </h1>
                    <StatusPill active={data.active} deleted={data.deleted} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <TextBadge>
                      <span className="inline-flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {labelUserAppRole(data.role)}
                      </span>
                    </TextBadge>
                    {isInfluencer ? (
                      <TextBadge>
                        <span className="text-amber-700 dark:text-amber-300">Influencer</span>
                      </TextBadge>
                    ) : null}
                    {data.kycVerified || data.kycStatus === 'approved' ? (
                      <TextBadge>
                        <span className="text-emerald-700 dark:text-emerald-300">KYC</span>
                      </TextBadge>
                    ) : data.kycStatus && data.kycStatus !== 'not_started' ? (
                      <TextBadge>KYC: {data.kycStatus}</TextBadge>
                    ) : null}
                  </div>
                  <ThemeText as="p" tone="faint" className="mt-1.5 text-xs">
                    Login {lastLoginRelative ?? 'sem registro'} · conta{' '}
                    {createdRelative ?? formatDateTime(data.createdAt)}
                  </ThemeText>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Link to={`/dashboard/trades?userId=${data._id}`} className="inline-flex">
                  <Button variant="secondary" size="sm">
                    <ArrowLeftRight className="h-4 w-4" />
                    Trades
                  </Button>
                </Link>
                {data.profileUrl ? (
                  <a
                    href={data.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="h-4 w-4" />
                      Steam
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl border border-separator bg-surface-secondary px-3 py-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-muted" />
                <div className="min-w-0">
                  <ThemeText as="p" tone="label" className="text-[10px] uppercase">
                    Último login
                  </ThemeText>
                  <ThemeText as="p" tone="primary" className="truncate text-xs font-medium">
                    {formatDateTime(data.lastLoginAt)}
                  </ThemeText>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-separator bg-surface-secondary px-3 py-2">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted" />
                <div className="min-w-0">
                  <ThemeText as="p" tone="label" className="text-[10px] uppercase">
                    Criado em
                  </ThemeText>
                  <ThemeText as="p" tone="primary" className="truncate text-xs font-medium">
                    {formatDateTime(data.createdAt)}
                  </ThemeText>
                </div>
              </div>
              <CopyableField
                label="Steam ID"
                value={data.steamId}
                href={data.steamId ? steamCommunityProfileUrl(data.steamId) : undefined}
              />
              <CopyableField label="ID interno" value={data._id} />
            </div>
          </Surface>

          <div className="grid gap-4 xl:grid-cols-2">
            <UserKycPanel user={data} />
            <UserEditPanel user={data} onUpdated={() => refetch()} />
          </div>

          <UserWalletPanel user={data} />

          <UserSiteInventoryPanel
            userId={data._id}
            isInfluencer={isInfluencer}
            walletCurrency={data.walletCurrency}
            onConverted={() => refetch()}
          />

          <UserCaseOpensPanel userId={data._id} />

          <UserArenaCrateOpensPanel userId={data._id} />
        </>
      ) : null}
    </div>
  )
}
