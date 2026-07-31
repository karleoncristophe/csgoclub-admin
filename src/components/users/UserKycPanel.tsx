import { BadgeCheck, IdCard, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Surface, surfaceClass } from '@/components/ui/Surface'
import { ThemeText } from '@/components/ui/ThemeText'
import { SectionTitle } from '@/components/ui/Title'
import { TextBadge } from '@/components/StatusPill'
import {
  useGetUserKycQuery,
  type UserAdminDetail,
} from '@/redux/store/api/users/api.users'
import { getErrorMessage } from '@/utils/getErrorMessage'

function labelKycStatus(status?: string) {
  switch (status) {
    case 'approved':
      return 'Aprovado'
    case 'in_progress':
      return 'Em andamento'
    case 'in_review':
      return 'Em análise'
    case 'declined':
      return 'Recusado'
    case 'expired':
      return 'Expirado'
    case 'abandoned':
      return 'Abandonado'
    case 'not_started':
    default:
      return 'Não iniciado'
  }
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

type UserKycPanelProps = {
  user: UserAdminDetail
}

export function UserKycPanel({ user }: UserKycPanelProps) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetUserKycQuery(user._id)

  const status = data?.status ?? user.kycStatus ?? 'not_started'
  const verified = data?.verified ?? user.kycVerified ?? status === 'approved'
  const sessions = data?.sessions ?? []

  return (
    <Surface variant="card" className="!p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle className="mb-2 flex items-center gap-2">
            <IdCard className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            Verificação KYC
          </SectionTitle>
          <ThemeText as="p" tone="secondary" className="text-sm">
            Status e histórico de sessões Didit do usuário.
          </ThemeText>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {isLoading ? (
        <ThemeText as="p" tone="secondary" className="text-sm">
          Carregando KYC...
        </ThemeText>
      ) : null}

      {isError ? (
        <p className={surfaceClass('errorBanner')}>{getErrorMessage(error)}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Status
          </ThemeText>
          <div className="mt-2 flex items-center gap-2">
            <TextBadge>
              <span
                className={
                  verified
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : status === 'declined'
                      ? 'text-rose-700 dark:text-rose-300'
                      : undefined
                }
              >
                {labelKycStatus(status)}
              </span>
            </TextBadge>
            {verified ? (
              <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Status Didit
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-2 text-sm font-medium">
            {data?.providerStatus ?? user.kycProviderStatus ?? '—'}
          </ThemeText>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Verificado em
          </ThemeText>
          <ThemeText as="p" tone="primary" className="mt-2 text-sm font-medium">
            {formatDateTime(data?.verifiedAt ?? user.kycVerifiedAt)}
          </ThemeText>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
          <ThemeText as="p" tone="label" className="text-xs uppercase">
            Sessão atual
          </ThemeText>
          <ThemeText
            as="p"
            tone="primary"
            className="mt-2 break-all font-mono text-[12px]"
          >
            {data?.sessionId ?? user.kycSessionId ?? '—'}
          </ThemeText>
        </div>
      </div>

      {data?.decisionSummary || user.kycDecisionSummary ? (
        <div className="mt-4 rounded-2xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
          <ThemeText as="p" tone="label" className="mb-2 text-xs uppercase">
            Resumo da decisão
          </ThemeText>
          <pre className="overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
            {JSON.stringify(
              data?.decisionSummary ?? user.kycDecisionSummary,
              null,
              2,
            )}
          </pre>
        </div>
      ) : null}

      <div className="mt-5">
        <ThemeText as="p" tone="label" className="mb-3 text-xs uppercase">
          Histórico de sessões
        </ThemeText>
        {sessions.length === 0 ? (
          <ThemeText as="p" tone="secondary" className="text-sm">
            Nenhuma sessão KYC registrada.
          </ThemeText>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className="rounded-xl border border-zinc-200/80 px-4 py-3 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <ThemeText as="p" tone="primary" className="font-mono text-xs">
                    {session.sessionId}
                  </ThemeText>
                  <TextBadge>{labelKycStatus(session.status)}</TextBadge>
                </div>
                <ThemeText as="p" tone="faint" className="mt-1 text-xs">
                  Criada {formatDateTime(session.createdAt)} · Atualizada{' '}
                  {formatDateTime(session.updatedAt)}
                  {session.providerStatus
                    ? ` · Didit: ${session.providerStatus}`
                    : ''}
                </ThemeText>
              </div>
            ))}
          </div>
        )}
      </div>
    </Surface>
  )
}
