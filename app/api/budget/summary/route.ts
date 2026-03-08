import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { startOfMonth, endOfMonth, currentMonth } from '@/lib/date-utils'
import { CATEGORY_LABELS } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') || currentMonth()
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
    select: {
      id: true, date: true, description: true, amount: true,
      category: true, nature: true, classificationSource: true,
    },
    orderBy: { date: 'desc' },
  })

  // Group by category
  const categoryMap: Record<string, { spent: number; transactions: typeof expenseRows }> = {}
  for (const t of expenseRows) {
    const cat = t.category || 'outros'
    if (!categoryMap[cat]) categoryMap[cat] = { spent: 0, transactions: [] }
    categoryMap[cat].spent += Math.abs(Number(t.amount))
    categoryMap[cat].transactions.push(t)
  }

  const budgetRules = await db.budget.findMany({ where: { monthOverride: null } })
  const ruleMap: Record<string, { targetPct: number; alertThresholdPct: number }> = {}
  for (const r of budgetRules) {
    ruleMap[r.category] = { targetPct: r.targetPct, alertThresholdPct: r.alertThresholdPct }
  }

  const allCategories = new Set([...Object.keys(ruleMap), ...Object.keys(categoryMap)])
  const categories = Array.from(allCategories).map((cat) => {
    const spent = categoryMap[cat]?.spent ?? 0
    const rule = ruleMap[cat]
    const limit = rule && personalIncome > 0 ? (personalIncome * rule.targetPct) / 100 : 0
    const rawPct = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 999 : 0
    return {
      category: cat,
      label: CATEGORY_LABELS[cat] || cat,
      spent,
      limit,
      pct: rawPct,
      targetPct: rule?.targetPct ?? 0,
      alertThresholdPct: rule?.alertThresholdPct ?? 80,
      transactions: (categoryMap[cat]?.transactions ?? []).map((t) => ({
        id: t.id,
        date: t.date,
        description: t.description,
        amount: Number(t.amount),
        nature: t.nature,
        source: t.classificationSource,
      })),
    }
  })

  // Sort: over limit first, then by pct descending
  categories.sort((a, b) => b.pct - a.pct)

  return NextResponse.json({ month, personalIncome, categories })
}
