import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { MODERATE_TEMPLATE, ASSET_TYPE_LIST } from '@/lib/investments/constants'
import { computePortfolioState, computeRebalanceProgress } from '@/lib/investments/portfolio-state'
import type { AllocationItem } from '@/lib/investments/portfolio-state'

/**
 * GET /api/investments/summary
 * Returns portfolio KPIs, allocation by type (with targets), and portfolio state.
 */
export async function GET() {
  const [assets, appConfig] = await Promise.all([
    db.asset.findMany({ where: { active: true } }),
    db.appConfig.findFirst({ where: { key: 'investment_mode' } }),
  ])

  const mode = appConfig?.value ?? 'normal'

  // Allocation targets for the current mode
  const targetRows = await db.allocationTarget.findMany({ where: { mode } })
  const targets: Record<string, number> = Object.fromEntries(
    ASSET_TYPE_LIST.map((t) => [t, MODERATE_TEMPLATE[t] ?? 0]),
  )
  for (const r of targetRows) {
    targets[r.assetType] = r.targetPct
  }

  const totalPortfolio = assets.reduce((s, a) => s + Number(a.currentValue), 0)
  const personalPortfolio = assets
    .filter((a) => a.purpose === 'personal')
    .reduce((s, a) => s + Number(a.currentValue), 0)

  const now = new Date()
  const staleCount = assets.filter((a) => {
    const days = (now.getTime() - new Date(a.lastUpdated).getTime()) / 86_400_000
    return days > 30
  }).length

  // Allocation by type
  const byType: Record<string, number> = {}
  for (const a of assets) {
    byType[a.type] = (byType[a.type] ?? 0) + Number(a.currentValue)
  }

  const allocationItems: AllocationItem[] = Object.entries(byType).map(([assetType, value]) => ({
    assetType,
    currentPct: totalPortfolio > 0 ? (value / totalPortfolio) * 100 : 0,
    targetPct: targets[assetType] ?? 0,
  }))

  const state = computePortfolioState(allocationItems, mode)
  const rebalanceProgress =
    state === 'REBALANCEANDO' ? computeRebalanceProgress(allocationItems) : undefined

  return NextResponse.json({
    totalPortfolio,
    personalPortfolio,
    assetCount: assets.length,
    staleCount,
    mode,
    state,
    rebalanceProgress,
    allocation: allocationItems,
  })
}
