import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
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
import { SectionTitle } from '@/components/ui/Title'
import { StatusPill, TextBadge } from '@/components/StatusPill'
import { UserInventoryPanel } from '@/components/users/UserInventoryPanel'
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
}: {
  label: string
  value?: string
  mono?: boolean
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
    <div className="group rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 transition hover:border-brand-200/80 hover:bg-brand-50/30 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:border-brand-800/60 dark:hover:bg-brand-950/20">
      <ThemeText as="p" tone="label" className="text-xs uppercase tracking-wide">
        {label}
      </ThemeText>
      <div className="mt-2 flex items-start justify-between gap-3">
        <ThemeText
          as="p"
          tone="primary"
          className={`min-w-0 break-all text-sm ${mono ? 'font-mono text-[13px]' : 'font-medium'}`}
        >
          {value}
        </ThemeText>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-brand-300 hover:text-brand-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-brand-700 dark:hover:text-brand-400"
          aria-label={`Copiar ${label}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock
  label: string
  value: string
  hint?: string
}) {
  return (
    <Surface variant="metricTile" className="!p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            {label}
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-1 text-sm font-semibold">
            {value}
          </ThemeText>
          {hint ? (
            <ThemeText as="p" tone="faint" className="mt-0.5 text-xs">
              {hint}
            </ThemeText>
          ) : null}
        </div>
      </div>
    </Surface>
  )
}

export default function UserDetailPage() {
  const { id = '' } = useParams()
  const { data, isLoading, isError, error } = useGetUserByIdQuery(id, {
    skip: !id,
  })

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
    <div className="space-y-6">
      <Link
        to="/dashboard/users"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar à listagem
      </Link>

      {isLoading ? (
        <div className="flex items-center gap-2 py-16 text-sm text-zinc-500 dark:text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Carregando perfil do usuário...
        </div>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      {data ? (
        <>
          <Surface
            variant="card"
            className="relative overflow-hidden !p-0"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-700/5 dark:from-brand-500/15 dark:to-brand-900/10"
              aria-hidden
            />
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/15" aria-hidden />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-brand-600/10 blur-3xl dark:bg-brand-700/10" aria-hidden />

            <div className="relative flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 opacity-70 blur-sm dark:from-brand-500 dark:to-brand-800" />
                  {avatar ? (
                    <img
                      src={avatar}
                      alt=""
                      className="relative h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl shadow-brand-900/20 dark:border-zinc-900 dark:shadow-black/40 sm:h-32 sm:w-32"
                    />
                  ) : (
                    <span className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-brand-500 to-brand-700 text-3xl font-bold text-white shadow-xl dark:border-zinc-900 sm:h-32 sm:w-32">
                      {data.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                      {data.name}
                    </h1>
                    <StatusPill active={data.active} deleted={data.deleted} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <TextBadge>
                      <span className="inline-flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        {labelUserAppRole(data.role)}
                      </span>
                    </TextBadge>
                  </div>

                  <ThemeText as="p" tone="secondary" className="mt-3 max-w-xl text-sm leading-relaxed">
                    Perfil Steam vinculado à plataforma CS2Club. Último acesso{' '}
                    {lastLoginRelative ? (
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {lastLoginRelative}
                      </span>
                    ) : (
                      'sem registro'
                    )}
                    .
                  </ThemeText>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                {data.profileUrl ? (
                  <a
                    href={data.profileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="secondary" size="sm">
                      <ExternalLink className="h-4 w-4" />
                      Perfil Steam
                    </Button>
                  </a>
                ) : null}
                <a
                  href={`https://steamcommunity.com/profiles/${data.steamId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex"
                >
                  <Button variant="ghost" size="sm">
                    Abrir por Steam ID
                  </Button>
                </a>
              </div>
            </div>
          </Surface>

          <div className="grid gap-4 sm:grid-cols-2">
            <InfoTile
              icon={Clock}
              label="Último login"
              value={formatDateTime(data.lastLoginAt, 'long')}
              hint={lastLoginRelative ?? undefined}
            />
            <InfoTile
              icon={Calendar}
              label="Conta criada"
              value={formatDateTime(data.createdAt, 'long')}
              hint={createdRelative ?? undefined}
            />
          </div>

          <Surface variant="card" className="!p-6">
            <SectionTitle className="mb-5">Identidade Steam</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2">
              <CopyableField label="Steam ID" value={data.steamId} />
              <CopyableField label="ID interno" value={data._id} />
              <CopyableField label="Nome exibido" value={data.name} mono={false} />
              <CopyableField label="URL do perfil" value={data.profileUrl} />
            </div>
          </Surface>

          <UserInventoryPanel userId={data._id} />
        </>
      ) : null}
    </div>
  )
}
