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

// GET /api/reserve/config — get current config + computed target
export async function GET() {
  const config = await db.emergencyReserveConfig.findFirst()
  if (!config) {
    return NextResponse.json({
      targetMonths: 4,
      calculationWindowMonths: 3,
      excludeOutliers: false,
      monthlyAvg: 0,
      targetValue: 0,
    })
  }

  const monthlyAvg = await computeMonthlyAvg(config.calculationWindowMonths, config.excludeOutliers)
  const targetValue = calculateReserveTarget(monthlyAvg, config.targetMonths)

  return NextResponse.json({ ...config, monthlyAvg, targetValue })
}

// PUT /api/reserve/config — update config
export async function PUT(req: Request) {
  const body = await req.json()
  const { targetMonths, calculationWindowMonths, excludeOutliers } = body

  const existing = await db.emergencyReserveConfig.findFirst()

  const data = {
    ...(targetMonths !== undefined && { targetMonths: Number(targetMonths) }),
    ...(calculationWindowMonths !== undefined && { calculationWindowMonths: Number(calculationWindowMonths) }),
    ...(excludeOutliers !== undefined && { excludeOutliers: Boolean(excludeOutliers) }),
  }

  const config = existing
    ? await db.emergencyReserveConfig.update({ where: { id: existing.id }, data })
    : await db.emergencyReserveConfig.create({ data: { targetMonths: 4, calculationWindowMonths: 3, excludeOutliers: false, ...data } })

  const monthlyAvg = await computeMonthlyAvg(config.calculationWindowMonths, config.excludeOutliers)
  const targetValue = calculateReserveTarget(monthlyAvg, config.targetMonths)

  return NextResponse.json({ ...config, monthlyAvg, targetValue })
}

async function computeMonthlyAvg(windowMonths: number, excludeOutliers: boolean): Promise<number> {
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

  return calculateMonthlyAverage(monthlyTotals, windowMonths, excludeOutliers)
}
