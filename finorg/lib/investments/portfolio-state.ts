import type { PortfolioState } from './constants'

export interface AllocationItem {
  assetType: string
  currentPct: number
  targetPct: number
}

/**
 * Compute the portfolio state based on current allocation vs targets.
 * - SOB_SONHO: when there's an active dream driving a different allocation mode
 * - REBALANCEANDO: when any asset type deviates more than 10pp from target (and mode is rebalanceando)
 * - EQUILIBRADA: otherwise
 */
export function computePortfolioState(
  items: AllocationItem[],
  mode: string,
): PortfolioState {
  if (mode === 'sonho_ativo') return 'SOB_SONHO'
  if (mode === 'rebalanceando') {
    const outOfBalance = items.some((i) => Math.abs(i.currentPct - i.targetPct) > 10)
    if (outOfBalance) return 'REBALANCEANDO'
  }
  return 'EQUILIBRADA'
}

/** Returns 0–100 progress toward balanced allocation (100 = perfectly balanced). */
export function computeRebalanceProgress(items: AllocationItem[]): number {
  if (items.length === 0) return 100
  const totalDev = items.reduce((s, i) => s + Math.abs(i.currentPct - i.targetPct), 0)
  return Math.max(0, Math.min(100, 100 - totalDev))
}
