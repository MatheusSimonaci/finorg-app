// Pure calculation functions for the Emergency Reserve module

export type ReserveStatus = 'critical' | 'warning' | 'ok' | 'complete'

export function calculateMonthlyAverage(
  monthlyTotals: number[],
  windowMonths: number,
  excludeOutliers: boolean
): number {
  if (monthlyTotals.length === 0) return 0
  const window = monthlyTotals.slice(-windowMonths)
  if (window.length === 0) return 0

  if (excludeOutliers && window.length >= 3) {
    const avg = window.reduce((s, v) => s + v, 0) / window.length
    const filtered = window.filter((v) => v <= avg * 2)
    if (filtered.length > 0) {
      return filtered.reduce((s, v) => s + v, 0) / filtered.length
    }
  }

  return window.reduce((s, v) => s + v, 0) / window.length
}

export function calculateReserveTarget(monthlyAvg: number, targetMonths: number): number {
  return monthlyAvg * targetMonths
}

export function calculateCoverageMonths(currentValue: number, monthlyAvg: number): number {
  if (monthlyAvg <= 0) return 0
  return currentValue / monthlyAvg
}

export function getReserveStatus(coverageMonths: number, targetMonths: number): ReserveStatus {
  if (coverageMonths < 2) return 'critical'
  if (coverageMonths < targetMonths) return 'warning'
  if (coverageMonths < targetMonths * 1.1) return 'ok'
  return 'complete'
}

export function calculateMonthlyContributionNeeded(
  currentValue: number,
  targetValue: number,
  targetMonths: number
): number {
  const gap = targetValue - currentValue
  if (gap <= 0) return 0
  if (targetMonths <= 0) return gap
  return gap / targetMonths
}
