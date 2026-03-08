import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { startOfMonth, endOfMonth } from '@/lib/date-utils'
import {
  calculateMonthlyAverage,
  calculateReserveTarget,
  calculateCoverageMonths,
  getReserveStatus,
  calculateMonthlyContributionNeeded,
} from '@/lib/reserve/calculator'

export const dynamic = 'force-dynamic'

// GET /api/reserve/status — full reserve panel data
export async function GET() {
  const config = await db.emergencyReserveConfig.findFirst()
  const targetMonths = config?.targetMonths ?? 4
  const windowMonths = config?.calculationWindowMonths ?? 3
  const excludeOutliers = config?.excludeOutliers ?? false

  // Compute monthly avg
  const now = new Date()
  const months: string[] = []
  for (let i = 0; i < windowMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthlyTotals: number[] = []
  for (const month of months) {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const rows = await db.transaction.findMany({
      where: {
        date: { gte: start, lte: end },
        type: 'gasto',
        isReimbursable: false,
        OR: [{ nature: null }, { nature: { notIn: ['empresa', 'work_tool'] } }],
      },
      select: { amount: true },
    })
    const total = rows.reduce((s, r) => s + Math.abs(Number(r.amount)), 0)
    monthlyTotals.push(total)
  }

  const monthlyAvg = calculateMonthlyAverage(monthlyTotals, windowMonths, excludeOutliers)
  const targetValue = calculateReserveTarget(monthlyAvg, targetMonths)

  // Aggregate reserve assets
  const reserveAssets = await db.asset.findMany({
    where: { purpose: 'reserve', active: true },
    select: { id: true, name: true, type: true, institution: true, currentValue: true, lastUpdated: true },
    orderBy: { currentValue: 'desc' },
  })

  const currentValue = reserveAssets.reduce((s, a) => s + Number(a.currentValue), 0)
  const coverageMonths = calculateCoverageMonths(currentValue, monthlyAvg)
  const status = getReserveStatus(coverageMonths, targetMonths)
  const monthlyContributionNeeded = calculateMonthlyContributionNeeded(currentValue, targetValue, 6)

  const lastUpdated = reserveAssets.length > 0
    ? reserveAssets.reduce((latest, a) => new Date(a.lastUpdated) > new Date(latest) ? a.lastUpdated.toISOString() : latest, reserveAssets[0].lastUpdated.toISOString())
    : null

  return NextResponse.json({
    currentValue,
    targetValue,
    targetMonths,
    monthlyAvg,
    coverageMonths,
    status,
    monthlyContributionNeeded,
    assets: reserveAssets.map((a) => ({
      ...a,
      currentValue: Number(a.currentValue),
      pct: currentValue > 0 ? (Number(a.currentValue) / currentValue) * 100 : 0,
    })),
    lastUpdated,
    hasData: monthlyAvg > 0,
    config: config ?? { targetMonths: 4, calculationWindowMonths: 3, excludeOutliers: false },
  })
}
