import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { startOfMonth, endOfMonth, currentMonth, addMonth } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const n = Math.min(Number(searchParams.get('months') || '12'), 24)
  const from = searchParams.get('from') || currentMonth()

  const months: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    months.push(addMonth(from, -i))
  }

  const excludePersonal = {
    isReimbursable: false as boolean,
    OR: [{ nature: null as string | null }, { nature: { notIn: ['empresa', 'work_tool'] } }],
  }

  const results = await Promise.all(
    months.map(async (month) => {
      const range = { date: { gte: startOfMonth(month), lte: endOfMonth(month) } }

      const [incomeRows, expenseRows, investedRows] = await Promise.all([
        db.transaction.findMany({
          where: { ...range, type: 'receita', ...excludePersonal },
          select: { amount: true },
        }),
        db.transaction.findMany({
          where: { ...range, type: 'gasto', ...excludePersonal },
          select: { amount: true },
        }),
        db.transaction.findMany({
          where: { ...range, type: 'investimento' },
          select: { amount: true },
        }),
      ])

      const income   = incomeRows.reduce((s, t) => s + Number(t.amount), 0)
      const expenses = expenseRows.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
      const invested = investedRows.reduce((s, t) => s + Math.abs(Number(t.amount)), 0)

      return { month, netBalance: income - expenses - invested, personalExpenses: expenses }
    }),
  )

  return NextResponse.json({ history: results })
}
