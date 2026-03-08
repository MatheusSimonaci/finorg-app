import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { startOfMonth, endOfMonth, currentMonth } from '@/lib/date-utils'
import { computeAlerts } from '@/lib/alerts/compute-alerts'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || currentMonth()
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const monthFilter = { date: { gte: start, lte: end } }

  const excludePersonalFilter = {
    isReimbursable: false as boolean,
    OR: [{ nature: null as string | null }, { nature: { notIn: ['empresa', 'work_tool'] } }],
  }

  // Personal income
  const incomeRows = await db.transaction.findMany({
    where: { ...monthFilter, type: 'receita', ...excludePersonalFilter },
    select: { amount: true },
  })
  const personalIncome = incomeRows.reduce((s, t) => s + Number(t.amount), 0)

  // Personal expenses
  const expenseRows = await db.transaction.findMany({
    where: { ...monthFilter, type: 'gasto', ...excludePersonalFilter },
    select: { amount: true, category: true },
  })
  const personalExpenses = expenseRows.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  // Invested
  const investedRows = await db.transaction.findMany({
    where: { ...monthFilter, type: 'investimento' },
    select: { amount: true },
  })
  const invested = investedRows.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

  // Budget rules
  const budgetRules = await db.budget.findMany({ where: { monthOverride: null } })
  const totalTargetPct = budgetRules.reduce((s, r) => s + r.targetPct, 0)
  const budgetTarget = (personalIncome * totalTargetPct) / 100
  const budgetPercent = budgetTarget > 0 ? (personalExpenses / budgetTarget) * 100 : 0

  // Last import
  const lastBatch = await db.importBatch.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  })

  // Expenses by category for donut chart
  const expensesByCategory: Record<string, number> = {}
  for (const t of expenseRows) {
    const cat = t.category || 'outros'
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(Number(t.amount))
  }
  const expensesChart = Object.entries(expensesByCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      pct: personalExpenses > 0 ? (amount / personalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Pending (unclassified) transactions in this month
  const pendingCount = await db.transaction.count({
    where: { ...monthFilter, type: null },
  })

  // Compute alerts
  const budgetSummaryForAlerts = budgetRules.map((rule) => {
    const spent = expensesByCategory[rule.category] || 0
    const limit = personalIncome > 0 ? (personalIncome * rule.targetPct) / 100 : 0
    return {
      category: rule.category,
      spent,
      limit,
      pct: limit > 0 ? (spent / limit) * 100 : 0,
      alertThresholdPct: rule.alertThresholdPct,
    }
  })

  const snoozed = await db.snoozedAlert.findMany({
    where: { snoozedUntil: { gt: new Date() } },
    select: { alertKey: true },
  })
  const snoozedKeys = new Set(snoozed.map((s) => s.alertKey))

  const recurringExpenses = await db.recurringExpense.findMany({
    where: { active: true },
    select: {
      id: true, name: true, type: true, amount: true, category: true,
      totalInstallments: true, currentInstallment: true, startDate: true, monthOfYear: true,
    },
  })
  const recurringInput = recurringExpenses.map((r) => ({ ...r, amount: Number(r.amount) }))

  const alerts = computeAlerts(budgetSummaryForAlerts, recurringInput, personalIncome, month, snoozedKeys)

  return NextResponse.json({
    month,
    personalIncome,
    personalExpenses,
    invested,
    netBalance: personalIncome - personalExpenses,
    budgetPercent,
    budgetTarget,
    lastImportDate: lastBatch?.createdAt ?? null,
    expensesChart,
    alertsCount: alerts.length,
    alerts: alerts.slice(0, 5),
    pendingCount,
    hasData: incomeRows.length > 0 || expenseRows.length > 0 || pendingCount > 0,
  })
}
