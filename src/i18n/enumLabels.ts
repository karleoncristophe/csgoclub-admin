/**
 * Rótulos em pt-BR para valores de enum / union vindos da API.
 * Use nas telas e filtros; os valores enviados à API permanecem em inglês (códigos).
 */

function pick(
  map: Readonly<Record<string, string>>,
  value: string | undefined | null,
): string {
  if (value == null || value === '') return '—'
  return map[value] ?? value
}

/** Papéis de administrador da plataforma (CreateAdminDto / Admin.role) */
export const ADMIN_ROLE_LABELS: Readonly<Record<string, string>> = {
  PLATFORM_ADMIN: 'Administrador da plataforma (master)',
  EVENT_MODERATOR: 'Moderador de eventos',
  CONTENT_MANAGER: 'Gestão de conteúdo',
  SUPPORT: 'Suporte',
  ANALYTICS: 'Análise / relatórios',
  FINANCIAL: 'Financeiro',
}

export function labelAdminRole(role: string | undefined | null): string {
  return pick(ADMIN_ROLE_LABELS, role)
}

/** Papéis de usuário final (app) */
const USER_APP_ROLE_LABELS: Readonly<Record<string, string>> = {
  USER: 'Usuário',
  ADMIN: 'Administrador',
}

export function labelUserAppRole(role: string | undefined | null): string {
  return pick(USER_APP_ROLE_LABELS, role)
}

/** Status de evento */
const EVENT_STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Concluído',
}

export function labelEventStatus(status: string | undefined | null): string {
  return pick(EVENT_STATUS_LABELS, status)
}

/** Status do pedido de pagamento (PaymentOrder.status) */
const PAYMENT_ORDER_STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
  PARTIALLY_REFUNDED: 'Parcialmente reembolsado',
}

export function labelPaymentOrderStatus(status: string | undefined | null): string {
  return pick(PAYMENT_ORDER_STATUS_LABELS, status)
}

const REFUND_REQUEST_STATUS_LABELS: Readonly<Record<string, string>> = {
  REQUESTED: 'Solicitado',
  UNDER_REVIEW: 'Em análise',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  REFUNDED: 'Reembolsado',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
}

export function labelRefundRequestStatus(status: string | undefined | null): string {
  return pick(REFUND_REQUEST_STATUS_LABELS, status)
}

/** Tipo de pedido de pagamento (PaymentOrder.kind) */
const PAYMENT_ORDER_KIND_LABELS: Readonly<Record<string, string>> = {
  EVENT_TICKET_CHECKOUT: 'Checkout de ingresso',
  RESALE_CHECKOUT: 'Checkout de revenda',
  MANUAL: 'Manual',
}

export function labelPaymentOrderKind(kind: string | undefined | null): string {
  return pick(PAYMENT_ORDER_KIND_LABELS, kind)
}

/** Status da conta de repasse (ProducerPayoutAccount.status) */
const PAYOUT_ACCOUNT_STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING: 'Pendente',
  VERIFIED: 'Verificada',
  REJECTED: 'Rejeitada',
  DISABLED: 'Desabilitada',
}

export function labelPayoutAccountStatus(status: string | undefined | null): string {
  return pick(PAYOUT_ACCOUNT_STATUS_LABELS, status)
}

/** Status do pedido de saque (PayoutRequest.status) */
const PAYOUT_REQUEST_STATUS_LABELS: Readonly<Record<string, string>> = {
  REQUESTED: 'Solicitado',
  UNDER_REVIEW: 'Em análise',
  APPROVED: 'Aprovado',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  REJECTED: 'Rejeitado',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
}

export function labelPayoutRequestStatus(status: string | undefined | null): string {
  return pick(PAYOUT_REQUEST_STATUS_LABELS, status)
}

/** Gateway / provider de pagamento */
const PAYMENT_PROVIDER_LABELS: Readonly<Record<string, string>> = {
  IUGU: 'Iugu',
  STRIPE: 'Stripe',
  PAGARME: 'Pagar.me',
}

export function labelPaymentProvider(code: string | undefined | null): string {
  if (code == null || code === '') return '—'
  return PAYMENT_PROVIDER_LABELS[code] ?? code
}

/** Modo de liquidação / settlement */
const SETTLEMENT_MODE_LABELS: Readonly<Record<string, string>> = {
  PLATFORM_SUBACCOUNT: 'Subconta da plataforma',
  PLATFORM_MASTER_ACCOUNT: 'Conta mestre da plataforma',
  DIRECT_PROVIDER_API: 'API própria do cliente',
}

export function labelSettlementMode(mode: string | undefined | null): string {
  return pick(SETTLEMENT_MODE_LABELS, mode)
}

/** Status da credencial API própria do produtor */
const PROVIDER_API_CONFIG_STATUS_LABELS: Readonly<Record<string, string>> = {
  NOT_CONFIGURED: 'Não configurada',
  PENDING: 'Em validação',
  CONFIGURED: 'Configurada',
}

export function labelProviderApiConfigStatus(status: string | undefined | null): string {
  return pick(PROVIDER_API_CONFIG_STATUS_LABELS, status)
}

/** Meio de pagamento em pedidos / taxas */
const PAYMENT_METHOD_LABELS: Readonly<Record<string, string>> = {
  CREDIT_CARD: 'Cartão de crédito',
  DEBIT_CARD: 'Cartão de débito',
  PIX: 'Pix',
  BOLETO: 'Boleto',
  BANK_TRANSFER: 'Transferência bancária',
  CASH: 'Dinheiro',
  FREE: 'Grátis',
}

export function labelPaymentMethod(method: string | undefined | null): string {
  return pick(PAYMENT_METHOD_LABELS, method)
}

/** Status da compra do ingresso (Ticket.purchaseStatus) */
const TICKET_PURCHASE_STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING: 'Pagamento pendente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
  TRANSFER_PENDING: 'Transferência pendente',
  RESALE_PENDING: 'Revenda pendente',
  TRANSFERRED: 'Transferido',
  RESOLD: 'Revendido',
  REFUNDED: 'Reembolsado',
}

export function labelTicketPurchaseStatus(status: string | undefined | null): string {
  return pick(TICKET_PURCHASE_STATUS_LABELS, status)
}

/** Status de pagamento em contexto de ticket (quando exposto) */
const TICKET_PAYMENT_STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  PAID: 'Pago',
  FAILED: 'Falhou',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
  PARTIALLY_REFUNDED: 'Parcialmente reembolsado',
}

export function labelTicketPaymentStatus(status: string | undefined | null): string {
  return pick(TICKET_PAYMENT_STATUS_LABELS, status)
}

/** Convite de colaborador */
const INVITE_STATUS_LABELS: Readonly<Record<string, string>> = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  REJECTED: 'Rejeitado',
  EXPIRED: 'Expirado',
}

export function labelInviteStatus(status: string | undefined | null): string {
  return pick(INVITE_STATUS_LABELS, status)
}

/** Status de transferência de ingresso */
const TICKET_TRANSFER_STATUS_LABELS: Readonly<Record<string, string>> = {
  GIFT: 'Presente',
  RESALE: 'Revenda',
  TRANSFER: 'Transferência',
  PENDING: 'Pendente',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
  REJECTED: 'Rejeitada',
}

export function labelTicketTransferStatus(status: string | undefined | null): string {
  return pick(TICKET_TRANSFER_STATUS_LABELS, status)
}

/** Status de anúncio de revenda */
const TICKET_RESALE_STATUS_LABELS: Readonly<Record<string, string>> = {
  ACTIVE: 'Ativo',
  PENDING: 'Pendente',
  SOLD: 'Vendido',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
}

export function labelTicketResaleStatus(status: string | undefined | null): string {
  return pick(TICKET_RESALE_STATUS_LABELS, status)
}

/** Modo de saque na conta de repasse */
const PAYOUT_METHOD_LABELS: Readonly<Record<string, string>> = {
  BANK_SAME_OWNER: 'Conta titular (mesmo titular)',
  PIX_KEY: 'Chave Pix',
}

export function labelPayoutMethod(method: string | undefined | null): string {
  return pick(PAYOUT_METHOD_LABELS, method)
}

/** Tipo de chave Pix */
const PIX_KEY_TYPE_LABELS: Readonly<Record<string, string>> = {
  email: 'E-mail',
  phone: 'Telefone',
  cpf: 'CPF',
  evp: 'Chave aleatória',
}

export function labelPixKeyType(t: string | undefined | null): string {
  return pick(PIX_KEY_TYPE_LABELS, t)
}

/** Filtros Sim/Não (valor da option = string "true" | "false") */
const FILTER_BOOL_LABELS: Readonly<Record<string, string>> = {
  true: 'Sim',
  false: 'Não',
}

export function labelFilterBoolean(value: string | undefined | null): string {
  return pick(FILTER_BOOL_LABELS, value)
}
