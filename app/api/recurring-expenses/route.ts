import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { currentMonth, startOfMonth } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeSuggestions = searchParams.get('suggestions') === 'true'

  const expenses = await db.recurringExpense.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })
  const serialized = expenses.map((e) => ({ ...e, amount: Number(e.amount) }))

  let suggestions: Array<{ description: string; amount: number; category: string | null; count: number }> = []
  if (includeSuggestions) {
    const month = currentMonth()
    const [year, mo] = month.split('-').map(Number)
    const twoMonthsAgo = new Date(year, mo - 3, 1)
    const endLastMonth = startOfMonth(month)

    const recent = await db.transaction.findMany({
      where: { date: { gte: twoMonthsAgo, lt: endLastMonth }, type: 'gasto' },
      select: { description: true, amount: true, category: true, date: true },
    })

    const groups: Record<string, { amount: number; category: string | null; months: Set<string> }> = {}
    for (const t of recent) {
      const key = `${t.description}_${Math.abs(Number(t.amount)).toFixed(2)}`
      if (!groups[key]) {
        groups[key] = { amount: Math.abs(Number(t.amount)), category: t.category, months: new Set() }
      }
      const mKey = `${t.date.getFullYear()}-${t.date.getMonth()}`
      groups[key].months.add(mKey)
    }

    const existingNames = new Set(expenses.map((e) => e.name.toLowerCase()))
    suggestions = Object.entries(groups)
      .filter(([, v]) => v.months.size >= 2)
      .map(([key, v]) => ({
        description: key.split('_').slice(0, -1).join('_'),
        amount: v.amount,
        category: v.category,
        count: v.months.size,
      }))
      .filter((s) => !existingNames.has(s.description.toLowerCase()))
      .slice(0, 5)
  }

  return NextResponse.json({ expenses: serialized, suggestions })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, type, amount, category, totalInstallments, currentInstallment, startDate, monthOfYear, notes } = body

  if (!name || !type || amount == null || !category) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: name, type, amount, category' },
      { status: 400 },
    )
  }

  const expense = await db.recurringExpense.create({
    data: {
      name,
      type,
      amount,
      category,
      totalInstallments: totalInstallments ?? null,
      currentInstallment: currentInstallment ?? null,
      startDate: startDate ? new Date(startDate) : null,
      monthOfYear: monthOfYear ?? null,
      notes: notes ?? null,
    },
  })

  return NextResponse.json({ ...expense, amount: Number(expense.amount) }, { status: 201 })
}
