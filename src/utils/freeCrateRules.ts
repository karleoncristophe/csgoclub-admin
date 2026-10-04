import type { FreeKind } from '@/redux/store/api/free-crates/api.free-crates'
import { FREE_LABELS } from '@/redux/store/api/free-crates/api.free-crates'
import { formatSkinsPrice, SkinsCurrency } from '@/constants/skinsCurrency'

/** Limiares em centavos BRL — espelho de `FREE_CRATE_THRESHOLDS` no backend. */
export const FREE_CRATE_THRESHOLDS_CENTS: Partial<Record<FreeKind, number>> = {
  deposit_20: 2000,
  deposit_100: 10000,
  deposit_250: 25000,
  deposit_500: 50000,
  deposit_1000: 100000,
}

export type FreeCrateUnlockGroup = 'welcome' | 'deposit' | 'daily'

export function freeCrateUnlockGroup(kind: FreeKind): FreeCrateUnlockGroup {
  if (kind === 'welcome') return 'welcome'
  if (kind === 'daily') return 'daily'
  return 'deposit'
}

export function freeCrateThresholdBrl(kind: FreeKind): number | null {
  const cents = FREE_CRATE_THRESHOLDS_CENTS[kind]
  return cents == null ? null : cents / 100
}

export function freeCrateUnlockSummary(kind: FreeKind): string {
  const threshold = freeCrateThresholdBrl(kind)
  if (kind === 'welcome') {
    return 'Primeiro depósito elegível (uma vez por conta)'
  }
  if (kind === 'daily') {
    return 'Resgate diário após depósito (janela de 7 dias)'
  }
  if (threshold != null) {
    return `Depósito do dia ≥ ${formatSkinsPrice(threshold, SkinsCurrency.BRL)}`
  }
  return FREE_LABELS[kind]
}

export function freeCrateUnlockDetails(kind: FreeKind): string[] {
  if (kind === 'welcome') {
    return [
      'Concedida uma única vez, no primeiro depósito principal confirmado (Pix/cripto).',
      'Contas antigas que já depositaram não recebem; contas sem depósito ainda podem.',
      'Persiste após o reset diário até ser aberta.',
    ]
  }
  if (kind === 'daily') {
    return [
      'Exige depósito elegível mínimo de R$ 20 (ou equivalente) para abrir a janela.',
      'Um resgate por dia global; a janela dura sete dias a partir do depósito e renovação não acumula.',
      'Dias sem resgate são perdidos — não acumulam.',
    ]
  }
  const threshold = freeCrateThresholdBrl(kind)
  return [
    `Libera quando a soma dos depósitos elegíveis do dia global atinge ${formatSkinsPrice(threshold ?? 0, SkinsCurrency.BRL)}.`,
    'Faixas são acumulativas no mesmo dia: um depósito maior libera todas as faixas atingidas.',
    'Persiste após o reset até ser aberta; o progresso do dia zera às 06:00 de São Paulo.',
  ]
}

export function freeCrateGroupLabel(group: FreeCrateUnlockGroup): string {
  if (group === 'welcome') return 'Boas-vindas (única)'
  if (group === 'daily') return 'Resgate diário'
  return 'Faixa de depósito (acumulativa)'
}
