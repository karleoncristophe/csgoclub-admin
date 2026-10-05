import type { FreeKind } from '@/redux/store/api/free-crates/api.free-crates'
import { FREE_LABELS } from '@/redux/store/api/free-crates/api.free-crates'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'

export type FreeCrateMoney = { brl: number; usd: number; eur: number }

/** Espelho de `FREE_CRATE_DEFAULT_THRESHOLDS` / mínimo do backend. */
export const FREE_CRATE_MINIMUM_DEPOSIT: FreeCrateMoney = {
  brl: 20,
  usd: 4,
  eur: 3.7,
}

export const FREE_CRATE_DEFAULT_THRESHOLDS: Partial<
  Record<FreeKind, FreeCrateMoney>
> = {
  deposit_20: { brl: 20, usd: 4, eur: 3.7 },
  deposit_100: { brl: 100, usd: 20, eur: 18.5 },
  deposit_250: { brl: 250, usd: 50, eur: 46 },
  deposit_500: { brl: 500, usd: 100, eur: 92 },
  deposit_1000: { brl: 1000, usd: 200, eur: 185 },
}

export type FreeCrateUnlockGroup = 'welcome' | 'deposit' | 'daily'

export function freeCrateUnlockGroup(kind: FreeKind): FreeCrateUnlockGroup {
  if (kind === 'welcome') return 'welcome'
  if (kind === 'daily') return 'daily'
  return 'deposit'
}

export function resolveFreeCrateThreshold(
  kind: FreeKind,
  crate?: {
    unlockThresholdBrl?: number
    unlockThresholdUsd?: number
    unlockThresholdEur?: number
  } | null,
): FreeCrateMoney | null {
  if (kind === 'welcome') return null
  const fallback =
    FREE_CRATE_DEFAULT_THRESHOLDS[kind] ?? FREE_CRATE_MINIMUM_DEPOSIT
  return {
    brl:
      Number(crate?.unlockThresholdBrl) > 0
        ? Number(crate?.unlockThresholdBrl)
        : fallback.brl,
    usd:
      Number(crate?.unlockThresholdUsd) > 0
        ? Number(crate?.unlockThresholdUsd)
        : fallback.usd,
    eur:
      Number(crate?.unlockThresholdEur) > 0
        ? Number(crate?.unlockThresholdEur)
        : fallback.eur,
  }
}

export function formatFreeCrateMoney(money: FreeCrateMoney): string {
  return [
    formatSkinsPrice(money.brl, SkinsCurrency.BRL),
    formatSkinsPrice(money.usd, SkinsCurrency.USD),
    formatSkinsPrice(money.eur, SkinsCurrency.EUR),
  ].join(' · ')
}

export function freeCrateUnlockSummary(
  kind: FreeKind,
  threshold?: FreeCrateMoney | null,
): string {
  if (kind === 'welcome') {
    return 'Primeiro depósito elegível (uma vez por conta)'
  }
  if (kind === 'daily') {
    const min = threshold ?? FREE_CRATE_MINIMUM_DEPOSIT
    return `Resgate diário após depósito ≥ ${formatFreeCrateMoney(min)}`
  }
  if (threshold) {
    return `Depósito do dia ≥ ${formatFreeCrateMoney(threshold)}`
  }
  return FREE_LABELS[kind]
}

export function freeCrateUnlockDetails(
  kind: FreeKind,
  threshold?: FreeCrateMoney | null,
): string[] {
  if (kind === 'welcome') {
    return [
      'Concedida uma única vez, no primeiro depósito principal confirmado (Pix/cripto).',
      'O mínimo elegível segue a faixa R$20 / USD / EUR configurada na campanha.',
      'Contas antigas que já depositaram não recebem; contas sem depósito ainda podem.',
      'Persiste após o reset diário até ser aberta.',
    ]
  }
  if (kind === 'daily') {
    const min = threshold ?? FREE_CRATE_MINIMUM_DEPOSIT
    return [
      `Exige depósito elegível mínimo de ${formatFreeCrateMoney(min)} para abrir a janela.`,
      'Um resgate por dia global; a janela dura sete dias a partir do depósito e renovação não acumula.',
      'Dias sem resgate são perdidos — não acumulam.',
    ]
  }
  const money = threshold ?? resolveFreeCrateThreshold(kind)
  return [
    `Libera quando a soma dos depósitos elegíveis do dia global atinge ${formatFreeCrateMoney(money!)} (elegibilidade canônica em BRL; USD/EUR são limiares fixos da campanha).`,
    'Faixas são acumulativas no mesmo dia: um depósito maior libera todas as faixas atingidas.',
    'Persiste após o reset até ser aberta; o progresso do dia zera às 06:00 de São Paulo.',
  ]
}

export function freeCrateGroupLabel(group: FreeCrateUnlockGroup): string {
  if (group === 'welcome') return 'Boas-vindas (única)'
  if (group === 'daily') return 'Resgate diário'
  return 'Faixa de depósito (acumulativa)'
}
