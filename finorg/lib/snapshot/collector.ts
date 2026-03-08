/**
 * Collects all data needed for the snapshot from Prisma.
 * Returns a structured object; sensitive fields (tokens, raw data) are excluded.
 */
import { prisma as db } from '@/lib/db'
import { currentMonth } from '@/lib/date-utils'

export type SnapshotData = {
  generatedAt: string
  month: string
  summary: {
    personalIncome: number
    personalExpenses: number
    invested: number
    netBalance: number
    budgetPercent: number
    budgetTarget: number
  }
  topCategories: Array<{ category: string; amount: number; pct: number }>
  assets: Array<{ name: string; type: string; institution: string; value: number; pct: number }>
  dreams: Array<{
    name: string
    targetAmount: number
    currentAmount: number
    progressPct: number
    status: string
    targetDate: string | null
  }>
  reserve: {
    targetMonths: number
    currentMonths: number
    targetAmount: number
    currentAmount: number
    status: 'ok' | 'critical' | 'warning'
  } | null
  maskValues: boolean
}

export async function collectSnapshotData(maskValues = false): Promise<SnapshotData> {
  const month = currentMonth()
  const [year, mo] = month.split('-').map(Number)
  const start = new Date(year, mo - 1, 1)
  const end = new Date(year, mo, 1)

  // ── Monthly transactions ─────────────────────────────────────────────────
  const txs = await db.transaction.findMany({
    where: { date: { gte: start, lt: end }, reviewStatus: { in: ['approved', 'overridden'] } },
  })

  const personal = txs.filter((t) => !t.isReimbursable && (t.nature === 'pessoal' || !t.nature))
  const personalIncome = personal
    .filter((t) => t.type === 'receita')
    .reduce((s, t) => s + Number(t.amount), 0)
  const personalExpenses = personal
    .filter((t) => t.type === 'gasto')
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const invested = txs
    .filter((t) => t.type === 'investimento')
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const netBalance = personalIncome - personalExpenses

  // ── Budget ───────────────────────────────────────────────────────────────
  const budgets = await db.budget.findMany({ where: { monthOverride: null } })
  const budgetTarget = budgets.reduce((s, b) => s + (personalIncome * b.targetPct) / 100, 0)
  const budgetPercent = budgetTarget > 0 ? (personalExpenses / budgetTarget) * 100 : 0

  // ── Top categories ───────────────────────────────────────────────────────
  const catMap = new Map<string, number>()
  for (const t of personal.filter((t) => t.type === 'gasto')) {
    const cat = t.category ?? 'Outros'
    catMap.set(cat, (catMap.get(cat) ?? 0) + Math.abs(Number(t.amount)))
  }
  const sorted = [...catMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topCategories = sorted.map(([category, amount]) => ({
    category,
    amount,
    pct: personalExpenses > 0 ? (amount / personalExpenses) * 100 : 0,
  }))

  // ── Assets ───────────────────────────────────────────────────────────────
  const assets = await db.asset.findMany({ where: { active: true, purpose: 'personal' } })
  const totalAssets = assets.reduce((s, a) => s + Number(a.currentValue), 0)
  const assetRows = assets.map((a) => ({
    name: a.name,
    type: a.type,
    institution: a.institution,
    value: Number(a.currentValue),
    pct: totalAssets > 0 ? (Number(a.currentValue) / totalAssets) * 100 : 0,
  }))

  // ── Dreams ───────────────────────────────────────────────────────────────
  const dreams = await db.dream.findMany({
    where: { status: { in: ['planejando', 'acumulando'] } },
    orderBy: { priorityOrder: 'asc' },
    include: { assets: { where: { active: true } } },
  })
  const dreamRows = dreams.map((d) => {
    const current = d.assets.reduce((s, a) => s + Number(a.currentValue), 0)
    const target = Number(d.targetAmount)
    return {
      name: d.name,
      targetAmount: target,
      currentAmount: current,
      progressPct: target > 0 ? Math.min((current / target) * 100, 100) : 0,
      status: d.status,
      targetDate: d.targetDate ? d.targetDate.toISOString().slice(0, 10) : null,
    }
  })

  // ── Reserve ──────────────────────────────────────────────────────────────
  let reserveBlock: SnapshotData['reserve'] = null
  try {
    const cfg = await db.emergencyReserveConfig.findFirst()
    if (cfg) {
      const reserveAssets = await db.asset.findMany({ where: { active: true, purpose: 'reserve' } })
      const currentAmount = reserveAssets.reduce((s, a) => s + Number(a.currentValue), 0)
      const windowStart = new Date()
      windowStart.setMonth(windowStart.getMonth() - cfg.calculationWindowMonths)
      const recentTxs = await db.transaction.findMany({
        where: {
          date: { gte: windowStart },
          type: 'gasto',
          reviewStatus: { in: ['approved', 'overridden'] },
        },
      })
      const monthlyAvg =
        recentTxs.reduce((s, t) => s + Math.abs(Number(t.amount)), 0) /
        Math.max(cfg.calculationWindowMonths, 1)
      const targetAmount = monthlyAvg * cfg.targetMonths
      const currentMonths = monthlyAvg > 0 ? currentAmount / monthlyAvg : 0
      reserveBlock = {
        targetMonths: cfg.targetMonths,
        currentMonths: Math.floor(currentMonths * 10) / 10,
        targetAmount,
        currentAmount,
        status:
          currentMonths >= cfg.targetMonths ? 'ok' : currentMonths < 1 ? 'critical' : 'warning',
      }
    }
  } catch {
    // reserve config not set up yet — leave null
  }

  return {
    generatedAt: new Date().toISOString(),
    month,
    summary: { personalIncome, personalExpenses, invested, netBalance, budgetPercent, budgetTarget },
    topCategories,
    assets: assetRows,
    dreams: dreamRows,
    reserve: reserveBlock,
    maskValues,
  }
}
