import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { startOfMonth, endOfMonth, currentMonth, lastNMonths, formatMonth } from '@/lib/date-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const to = searchParams.get('to') || currentMonth()
  const months = lastNMonths(6, to)

  const excludeFilter = {
    isReimbursable: false as boolean,
    OR: [{ nature: null as string | null }, { nature: { notIn: ['empresa', 'work_tool'] } }],
  }

  const results = await Promise.all(
    months.map(async (month) => {
      const start = startOfMonth(month)
      const end = endOfMonth(month)
      const rows = await db.transaction.findMany({
        where: { date: { gte: start, lte: end }, type: 'gasto', ...excludeFilter },
        select: { amount: true, category: true },
      })
      const byCategory: Record<string, number> = {}
      for (const t of rows) {
        const cat = t.category || 'outros'
        byCategory[cat] = (byCategory[cat] || 0) + Math.abs(Number(t.amount))
      }
      return { month, label: formatMonth(month), ...byCategory }
    }),
  )

  const allCats = new Set<string>()
  for (const r of results) {
    Object.keys(r).forEach((k) => {
      if (k !== 'month' && k !== 'label') allCats.add(k)
    })
  }

  return NextResponse.json({ months: results, categories: Array.from(allCats) })
}
