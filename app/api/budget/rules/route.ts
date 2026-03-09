import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rules = await db.budget.findMany({
    where: { monthOverride: null },
    orderBy: { category: 'asc' },
  })
  return NextResponse.json(rules)
}

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const { rules } = body as {
    rules: Array<{ category: string; targetPct: number; alertThresholdPct: number }>
  }

  const totalPct = rules.reduce((s, r) => s + r.targetPct, 0)
  if (totalPct > 100) {
    return NextResponse.json(
      { error: 'Soma dos percentuais não pode ultrapassar 100%' },
      { status: 400 },
    )
  }

  // Replace all default rules atomically
  await db.budget.deleteMany({ where: { monthOverride: null } })
  await db.budget.createMany({
    data: rules.map((r) => ({
      category: r.category,
      targetPct: r.targetPct,
      alertThresholdPct: r.alertThresholdPct,
      monthOverride: null,
    })),
  })

  return NextResponse.json({ saved: rules.length })
}
