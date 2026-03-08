import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { startOfMonth, endOfMonth, currentMonth } from '@/lib/date-utils'
import { computeAlerts, type BudgetCategoryData, type ReserveAlertInput } from '@/lib/alerts/compute-alerts'
import {
  calculateMonthlyAverage,
  calculateReserveTarget,
  calculateCoverageMonths,
  getReserveStatus,
  calculateMonthlyContributionNeeded,
} from '@/lib/reserve/calculator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || currentMonth()
  const includeSnoozed = searchParams.get('includeSnoozed') === 'true'

  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const monthFilter = { date: { gte: start, lte: end } }

  const excludeFilter = {
    isReimbursable: false as boolean,
    OR: [{ nature: null as string | null }, { nature: { notIn: ['empresa', 'work_tool'] } }],
  }

  const incomeRows = await db.transaction.findMany({
    where: { ...monthFilter, type: 'receita', ...excludeFilter },
    select: { amount: true },
  })
  const personalIncome = incomeRows.reduce((s, t) => s + Number(t.amount), 0)

  const expenseRows = await db.transaction.findMany({
    where: { ...monthFilter, type: 'gasto', ...excludeFilter },
    select: { amount: true, category: true },
  })
  const byCategory: Record<string, number> = {}
  for (const t of expenseRows) {
    const cat = t.category || 'outros'
    byCategory[cat] = (byCategory[cat] || 0) + Math.abs(Number(t.amount))
  }

  const budgetRules = await db.budget.findMany({ where: { monthOverride: null } })
  const budgetData: BudgetCategoryData[] = budgetRules.map((r) => {
    const spent = byCategory[r.category] || 0
    const limit = personalIncome > 0 ? (personalIncome * r.targetPct) / 100 : 0
    return {
      category: r.category,
      spent,
      limit,
      pct: limit > 0 ? (spent / limit) * 100 : 0,
      alertThresholdPct: r.alertThresholdPct,
    }
  })

  const snoozedRows = await db.snoozedAlert.findMany({
    where: includeSnoozed ? {} : { snoozedUntil: { gt: new Date() } },
    select: { alertKey: true, reason: true, snoozedUntil: true },
  })
  const snoozedKeys = includeSnoozed
    ? new Set<string>()
    : new Set(snoozedRows.map((s) => s.alertKey))

  const recurringExpenses = await db.recurringExpense.findMany({
    where: { active: true },
    select: {
      id: true, name: true, type: true, amount: true, category: true,
      totalInstallments: true, currentInstallment: true, startDate: true, monthOfYear: true,
    },
  })
  const recurringInput = recurringExpenses.map((r) => ({ ...r, amount: Number(r.amount) }))

  // Reserve data for alerts
  const reserveConfig = await db.emergencyReserveConfig.findFirst()
  const targetMonths = reserveConfig?.targetMonths ?? 4
  const windowMonths = reserveConfig?.calculationWindowMonths ?? 3
  const excludeOutliers = reserveConfig?.excludeOutliers ?? false

  const reserveMonths: string[] = []
  const now = new Date()
  for (let i = 0; i < windowMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    reserveMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const reserveMonthlyTotals: number[] = []
  for (const m of reserveMonths) {
    const s = startOfMonth(m); const e = endOfMonth(m)
    const rows = await db.transaction.findMany({
      where: { date: { gte: s, lte: e }, type: 'gasto', isReimbursable: false, OR: [{ nature: null }, { nature: { notIn: ['empresa', 'work_tool'] } }] },
      select: { amount: true },
    })
    reserveMonthlyTotals.push(rows.reduce((s, r) => s + Math.abs(Number(r.amount)), 0))
  }
  const monthlyAvg = calculateMonthlyAverage(reserveMonthlyTotals, windowMonths, excludeOutliers)
  const targetValue = calculateReserveTarget(monthlyAvg, targetMonths)
  const reserveAssets = await db.asset.findMany({ where: { purpose: 'reserve', active: true }, select: { currentValue: true } })
  const currentReserveValue = reserveAssets.reduce((s, a) => s + Number(a.currentValue), 0)
  const coverageMonths = calculateCoverageMonths(currentReserveValue, monthlyAvg)
  const monthlyContribution = calculateMonthlyContributionNeeded(currentReserveValue, targetValue, 6)

  const reserveData: ReserveAlertInput = monthlyAvg > 0
    ? { coverageMonths, targetMonths, currentValue: currentReserveValue, targetValue, monthlyContribution }
    : null

  const alerts = computeAlerts(budgetData, recurringInput, personalIncome, month, snoozedKeys, reserveData)

  return NextResponse.json({
    alerts,
    snoozed: includeSnoozed ? snoozedRows : undefined,
  })
}
