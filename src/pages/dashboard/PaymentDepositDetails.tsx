import { useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ThemeText } from '@/components/ui/ThemeText'
import { UserAvatarLink } from '@/components/users/UserAvatarLink'
import type { AdminPaymentDeposit } from '@/redux/store/api/payment/api.payment'

function formatWhen(iso?: string) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR')
}

function formatMoney(value?: number, currency = 'USD') {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function statusLabel(status: string) {
  if (status === 'pending') return 'Pendente'
  if (status === 'processing') return 'Processando'
  if (status === 'paid') return 'Pago'
  if (status === 'failed') return 'Falhou'
  if (status === 'cancelled') return 'Cancelado'
  return status
}

function methodLabel(item: AdminPaymentDeposit) {
  if (item.method === 'pix') return 'Pix'
  const symbol = item.symbol || 'Cripto'
  return item.network ? `${symbol} · ${item.network}` : symbol
}

function creditSourceLabel(source?: string) {
  if (source === 'admin') return 'Admin (aprovação manual)'
  if (source === 'webhook') return 'Webhook da gateway'
  return 'Ainda não creditado'
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <ThemeText as="h3" tone="label" className="text-[10px] uppercase tracking-wide">
        {title}
      </ThemeText>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function DetailRow({
  label,
  value,
  hint,
  copy,
  children,
}: {
  label: string
  value?: string
  hint?: string
  copy?: boolean
  children?: ReactNode
}) {
  const [copied, setCopied] = useState(false)
  const display = value?.trim() ? value : children ? null : '—'

  const handleCopy = async () => {
    if (!value) return
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
      <div className="mt-1 flex items-start justify-between gap-2">
        <div className="min-w-0">
          {children ?? (
            <ThemeText
              as="p"
              tone="primary"
              className={`break-all text-sm ${copy ? 'font-mono text-xs' : 'font-medium'}`}
            >
              {display}
            </ThemeText>
          )}
          {hint ? (
            <ThemeText as="p" tone="secondary" className="mt-1 text-xs">
              {hint}
            </ThemeText>
          ) : null}
        </div>
        {copy && value ? (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="shrink-0 rounded-md p-1.5 text-muted transition hover:bg-default hover:text-foreground"
            aria-label={`Copiar ${label}`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function requestedAmount(item: AdminPaymentDeposit): { value?: number; currency: string } {
  if (item.method === 'pix') return { value: item.expectedBrlAmount, currency: 'BRL' }
  return { value: item.expectedUsdAmount, currency: 'USD' }
}

export function requestedAmountLabel(item: AdminPaymentDeposit): string {
  const { value, currency } = requestedAmount(item)
  return formatMoney(value, currency)
}

function sourceCurrency(item: AdminPaymentDeposit): string {
  return item.fx?.fromCurrency || (item.method === 'pix' ? 'BRL' : 'USD')
}

function walletCurrency(item: AdminPaymentDeposit): string {
  return item.fx?.toCurrency || item.walletCurrency || sourceCurrency(item)
}

function FxSection({ item }: { item: AdminPaymentDeposit }) {
  const fx = item.fx
  if (!fx) return null

  const from = sourceCurrency(item)
  const to = walletCurrency(item)
  const sameCurrency = from === to
  const rateBrl = fx.rateBrl != null ? Number(fx.rateBrl) : undefined

  return (
    <Section title="Câmbio (referência)">
      {sameCurrency ? (
        <DetailRow
          label="Crédito"
          value={formatMoney(item.walletAmount ?? fx.sourceAmount, to)}
          hint={
            item.method === 'pix'
              ? 'Pix é BRL. O valor creditado é o do Pix, sem virar dólar. A cotação abaixo só existe para cupom, cashback e relatório em USD.'
              : 'A carteira está na mesma moeda do pagamento. O valor não foi convertido.'
          }
        />
      ) : (
        <DetailRow
          label="Conversão na carteira"
          value={`${formatMoney(fx.sourceAmount, from)} → ${formatMoney(
            item.walletAmount ?? fx.convertedAmount,
            to,
          )}`}
          hint="A carteira do jogador não está na mesma moeda do pagamento. O valor de origem não muda; o saldo entra convertido."
        />
      )}
      {fx.paidUsd != null ? (
        <DetailRow
          label="Equivalente em USD"
          value={formatMoney(Number(fx.paidUsd), 'USD')}
          hint="Não é o valor do Pix. É só a conversão interna (cupom e métricas usam USD)."
        />
      ) : null}
      {rateBrl != null ? (
        <DetailRow
          label="Cotação do dia"
          value={`1 USD = ${formatMoney(rateBrl, 'BRL')}`}
          hint="Isso é a taxa de câmbio, não o valor do depósito. R$ 5,00 ÷ 5,20 ≈ US$ 0,96."
        />
      ) : null}
      {fx.rateEur != null ? (
        <DetailRow label="Cotação EUR" value={`1 USD = ${String(fx.rateEur)} EUR`} />
      ) : null}
    </Section>
  )
}

export function PaymentDepositDetails({ item }: { item: AdminPaymentDeposit }) {
  const pix = item.method === 'pix'
  const requested = requestedAmount(item)
  const gatewayPaid = pix
    ? formatMoney(item.brlAmount, 'BRL')
    : formatMoney(item.usdAmount ?? item.cryptoAmount, 'USD')
  const fx = item.fx

  return (
    <div className="space-y-5">
      <Section title="Jogador">
        <DetailRow label="Conta">
          <div className="flex items-center gap-2">
            <UserAvatarLink
              avatar={item.user?.avatar}
              name={item.user?.name}
              size="sm"
              userId={item.user?.id}
            />
            <div className="min-w-0">
              {item.user?.id ? (
                <Link
                  className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  to={`/dashboard/users/${item.user.id}`}
                >
                  {item.user.name || item.user.id}
                </Link>
              ) : (
                <ThemeText tone="primary">{item.user?.name || '—'}</ThemeText>
              )}
              <ThemeText as="p" tone="secondary" className="font-mono text-xs">
                {item.user?.steamId || '—'}
              </ThemeText>
            </div>
          </div>
        </DetailRow>
      </Section>

      <Section title="Pedido no site">
        <DetailRow
          label={pix ? 'Valor do Pix' : 'Valor do depósito'}
          value={formatMoney(requested.value, requested.currency)}
          hint={
            pix
              ? 'Quanto o jogador gerou no site. Pix credita este valor.'
              : 'Pedido no site. Quando a XGate confirma, este campo passa a ser o USD que caiu (ex.: digitou 1, caiu 3,5 → fica 3,5).'
          }
        />
        <DetailRow
          label="Método"
          value={`${methodLabel(item)} · ${item.provider === 'woovi' ? 'Woovi' : 'XGate'}`}
        />
        <DetailRow label="Status" value={statusLabel(item.status)} />
        {item.address ? (
          <DetailRow
            copy
            label={pix ? 'Pix copia e cola' : 'Endereço de depósito'}
            value={item.address}
            hint={
              pix
                ? 'Código Pix gerado na Woovi para esta cobrança.'
                : 'Carteira da XGate deste jogador nesta rede. O pagamento on-chain cai aqui.'
            }
          />
        ) : null}
        {item.memo ? <DetailRow copy label="Memo / tag" value={item.memo} /> : null}
      </Section>

      <Section title="O que a gateway viu">
        <DetailRow
          label={pix ? 'Pago na Woovi' : 'Pago na XGate / chain'}
          value={gatewayPaid}
          hint={
            pix
              ? 'Valor que a Woovi confirmou no Pix. Vazio se o webhook ainda não chegou ou a consulta falhou.'
              : 'O que a XGate devolve: valor líquido que chegou, já sem a taxa de rede. Webhook e “Consultar e creditar” usam este número. Se a API não voltou, o admin informa o líquido no comprovante.'
          }
        />
        <DetailRow
          copy
          label={pix ? 'ID da cobrança Woovi' : 'ID do depósito na XGate'}
          value={item.providerDepositId}
          hint={
            pix
              ? 'Identificador da charge na Woovi.'
              : 'Só existe depois que a XGate cria o depósito (em geral no webhook). Sem este ID, “Consultar e creditar” não tem o que buscar na API.'
          }
        />
        {item.providerCustomerId ? (
          <DetailRow
            copy
            label="Cliente na XGate"
            value={item.providerCustomerId}
            hint="ID do customer da XGate ligado a este jogador."
          />
        ) : null}
      </Section>

      <Section title="Crédito na carteira">
        <DetailRow
          label="Creditado"
          value={formatMoney(item.walletAmount, item.walletCurrency || 'USD')}
          hint="Saldo que entrou na carteira do jogador, já na moeda dele, com cashback e cupom se houver."
        />
        <DetailRow
          label="Origem do crédito"
          value={creditSourceLabel(item.creditSource)}
        />
        {item.cashbackPercent != null ? (
          <DetailRow
            label="Cashback"
            value={`${item.cashbackPercent}%${
              item.cashbackUsdAmount != null
                ? ` · ${formatMoney(item.cashbackUsdAmount, 'USD')}`
                : ''
            }`}
            hint="Percentual da gateway no momento do depósito. Teto, se houver, já foi aplicado no valor creditado."
          />
        ) : null}
        {item.couponCode ? (
          <DetailRow
            label="Cupom"
            value={`${item.couponCode}${
              item.couponBonusUsdAmount != null
                ? ` · bônus ${formatMoney(item.couponBonusUsdAmount, 'USD')}`
                : ''
            }`}
            hint={
              item.couponOwner?.name
                ? `Cupom de ${item.couponOwner.name}.`
                : 'Código usado na hora de gerar o depósito.'
            }
          />
        ) : null}
        {item.approveNote ? (
          <DetailRow
            copy
            label="Comprovante / hash"
            value={item.approveNote}
            hint="Nota gravada na aprovação manual (hash da transação ou protocolo)."
          />
        ) : null}
      </Section>

      <Section title="Linha do tempo">
        <DetailRow label="Criado no site" value={formatWhen(item.createdAt)} />
        <DetailRow
          label="Pago"
          value={formatWhen(item.paidAt)}
          hint="Quando o depósito foi marcado como pago (webhook ou admin)."
        />
        <DetailRow
          label="Creditado"
          value={formatWhen(item.creditedAt)}
          hint="Quando o saldo entrou na carteira."
        />
        <DetailRow label="Aprovado no admin" value={formatWhen(item.approvedAt)} />
        <DetailRow copy label="ID interno" value={item.id} />
      </Section>

      {fx && Object.keys(fx).length > 0 ? (
        <FxSection item={item} />
      ) : null}
    </div>
  )
}
