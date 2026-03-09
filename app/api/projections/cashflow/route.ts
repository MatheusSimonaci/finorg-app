import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { detectRecurring } from '@/lib/projections/recurring-detector'
import { buildCashflowProjection } from '@/lib/projections/cashflow-engine'

export const dynamic = 'force-dynamic'

function monthsBefore(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}

export async function GET() {
  const [transactions, dbExpenses] = await Promise.all([
    db.transaction.findMany({
      where: {
        date: { gte: monthsBefore(6) },
        nature: 'pessoal',
        isReimbursable: false,
      },
      orderBy: { date: 'desc' },
    }),
    db.recurringExpense.findMany({ where: { active: true } }),
  ])

  const txSamples = transactions.map((t) => ({
    description: t.description,
    amount: Number(t.amount),
    category: t.category ?? 'outros',
    type: t.type ?? 'gasto',
    month: t.date.toISOString().slice(0, 7),
  }))

  const recurring = detectRecurring(txSamples)

  const dbItems = dbExpenses.map((e) => ({
    name: e.name,
    amount: Number(e.amount),
    category: e.category,
    type: e.type as 'installment' | 'seasonal',
    monthOfYear: e.monthOfYear ?? undefined,
  }))

  const projections = buildCashflowProjection(recurring, dbItems)

  return NextResponse.json({ projections, detectedCount: recurring.length })
}
