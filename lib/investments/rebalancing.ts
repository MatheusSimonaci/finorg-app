// Rebalancing engine for post-dream portfolio recovery

export type AssetTypeAllocation = {
  assetType: string
  currentPct: number
  targetPct: number
}

export function computeRebalancingProgress(
  current: AssetTypeAllocation[],
  initialDeviations: Record<string, number>
): number {
  const initialTotal = Object.values(initialDeviations).reduce((s, v) => s + Math.abs(v), 0)
  if (initialTotal === 0) return 100

  const currentTotal = current.reduce((sum, row) => {
    return sum + Math.abs(row.currentPct - row.targetPct)
  }, 0)

  return Math.max(0, Math.round((1 - currentTotal / initialTotal) * 100))
}

export function isRebalanced(current: AssetTypeAllocation[], tolerancePct = 5): boolean {
  return current.every((row) => Math.abs(row.currentPct - row.targetPct) <= tolerancePct)
}

export function suggestRebalanceContributions(
  current: AssetTypeAllocation[],
  totalMonthlyContribution: number
): Array<{ assetType: string; suggestedAmount: number; reason: string }> {
  const underweight = current.filter((row) => row.currentPct < row.targetPct - 1)
  if (underweight.length === 0) return []

  const totalGap = underweight.reduce((s, r) => s + (r.targetPct - r.currentPct), 0)

  return underweight.map((row) => {
    const gapShare = (row.targetPct - row.currentPct) / totalGap
    return {
      assetType: row.assetType,
      suggestedAmount: totalMonthlyContribution * gapShare,
      reason: `${row.assetType} está ${(row.targetPct - row.currentPct).toFixed(1)}pp abaixo do alvo`,
    }
  })
}

export function estimateMonthsToRebalance(
  current: AssetTypeAllocation[],
  portfolioTotal: number,
  monthlyContribution: number
): number {
  if (portfolioTotal <= 0 || monthlyContribution <= 0) return 0

  const underweight = current.filter((row) => row.currentPct < row.targetPct)
  const totalAmountNeeded = underweight.reduce((s, row) => {
    return s + ((row.targetPct - row.currentPct) / 100) * portfolioTotal
  }, 0)

  if (totalAmountNeeded <= 0) return 0
  return Math.ceil(totalAmountNeeded / monthlyContribution)
}
