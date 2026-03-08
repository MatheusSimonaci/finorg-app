import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { computeRebalancingProgress, isRebalanced, suggestRebalanceContributions, estimateMonthsToRebalance } from '@/lib/investments/rebalancing'

// GET /api/investments/rebalancing — rebalancing panel data
export async function GET() {
  const [allAssets, targets, lastDream] = await Promise.all([
    db.asset.findMany({ where: { active: true } }),
    db.allocationTarget.findMany({ where: { mode: 'normal' } }),
    db.dream.findFirst({ where: { status: 'realizado' }, orderBy: { achievedAt: 'desc' }, include: { rebalancingSnapshots: true } }),
  ])

  const portfolioTotal = allAssets.reduce((s, a) => s + Number(a.currentValue), 0)

  if (targets.length === 0 || portfolioTotal === 0) {
    return NextResponse.json({ state: 'no_data', rows: [] })
  }

  const byType: Record<string, number> = {}
  allAssets.forEach((a) => { byType[a.type] = (byType[a.type] ?? 0) + Number(a.currentValue) })

  const rows = targets.map((t) => {
    const currentPct = ((byType[t.assetType] ?? 0) / portfolioTotal) * 100
    return { assetType: t.assetType, currentPct: Number(currentPct.toFixed(2)), targetPct: t.targetPct }
  })

  const balanced = isRebalanced(rows)
  const initialDeviations: Record<string, number> = {}

  if (lastDream?.rebalancingSnapshots) {
    lastDream.rebalancingSnapshots.forEach((s) => {
      initialDeviations[s.assetType] = s.deviationPct
    })
  }

  const progress = Object.keys(initialDeviations).length > 0
    ? computeRebalancingProgress(rows, initialDeviations)
    : balanced ? 100 : 0

  const suggestions = suggestRebalanceContributions(rows, 1000) // placeholder monthly contribution
  const monthsEstimate = estimateMonthsToRebalance(rows, portfolioTotal, 1000)

  return NextResponse.json({
    state: balanced ? 'equilibrada' : 'rebalanceando',
    progress,
    portfolioTotal,
    rows,
    suggestions,
    monthsEstimate,
    lastDreamName: lastDream?.name ?? null,
    lastDreamAchievedAt: lastDream?.achievedAt ?? null,
  })
}
