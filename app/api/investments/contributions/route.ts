import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

/**
 * GET /api/investments/contributions
 * Returns monthly contribution data (positive month-over-month deltas per asset).
 * Also returns per-asset totals and current-month goal from AppConfig.
 */
export async function GET() {
  const [assets, snapshots, goalConfig, incomeConfig] = await Promise.all([
    db.asset.findMany({ where: { active: true }, select: { id: true, name: true, type: true } }),
    db.assetSnapshot.findMany({ orderBy: [{ assetId: 'asc' }, { month: 'asc' }] }),
    db.appConfig.findFirst({ where: { key: 'monthly_investment_goal' } }),
    db.appConfig.findFirst({ where: { key: 'income_investment_target_pct' } }),
  ])

  const goal = goalConfig ? Number(goalConfig.value) : 0
  const incomeTargetPct = incomeConfig ? Number(incomeConfig.value) : 20

  // Group snapshots by assetId
  const byAsset: Record<string, Array<{ month: string; value: number }>> = {}
  for (const s of snapshots) {
    if (!byAsset[s.assetId]) byAsset[s.assetId] = []
    byAsset[s.assetId].push({ month: s.month, value: Number(s.value) })
  }

  // Compute contributions (positive deltas) per asset per month
  type Contribution = { assetId: string; month: string; delta: number }
  const contributions: Contribution[] = []
  for (const [assetId, snaps] of Object.entries(byAsset)) {
    for (let i = 1; i < snaps.length; i++) {
      const delta = snaps[i].value - snaps[i - 1].value
      if (delta > 0) {
        contributions.push({ assetId, month: snaps[i].month, delta })
      }
    }
  }

  // Build last 12 months
  const now = new Date()
  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a]))

  // chartData: one entry per month with assetType keys
  const assetTypesSet = new Set<string>()
  const chartData = months.map((m) => {
    const monthContribs = contributions.filter((c) => c.month === m)
    const entry: Record<string, number | string> = { month: formatMonthLabel(m) }
    for (const c of monthContribs) {
      const asset = assetMap[c.assetId]
      if (!asset) continue
      assetTypesSet.add(asset.type)
      entry[asset.type] = ((entry[asset.type] as number) || 0) + c.delta
    }
    return entry
  })
  const assetTypes = Array.from(assetTypesSet)

  // Current month totals
  const currentMonthStr = months[months.length - 1]
  const currentMonthContribs = contributions.filter((c) => c.month === currentMonthStr)
  const currentMonthTotal = currentMonthContribs.reduce((s, c) => s + c.delta, 0)

  // Per-asset totals
  const byAssetSummary = assets.map((a) => {
    const assetContribs = contributions.filter((c) => c.assetId === a.id)
    const monthContrib = currentMonthContribs.find((c) => c.assetId === a.id)?.delta ?? 0
    const totalContribution = assetContribs.reduce((s, c) => s + c.delta, 0)
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      monthContribution: monthContrib,
      totalContribution,
    }
  }).filter((a) => a.totalContribution > 0)

  return NextResponse.json({
    chartData,
    assetTypes,
    currentMonth: {
      total: currentMonthTotal,
      goal,
      pctOfIncome: 0, // requires income data — calculated client-side if needed
      incomeTargetPct,
    },
    byAsset: byAssetSummary,
  })
}

function formatMonthLabel(yyyyMm: string): string {
  const [year, mo] = yyyyMm.split('-')
  const d = new Date(Number(year), Number(mo) - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}
