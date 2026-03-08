import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { simulateDream } from '@/lib/projections/dream-simulator'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dreamId = searchParams.get('dreamId')
  const contribution = Number(searchParams.get('contribution') ?? 500)

  if (!dreamId) {
    return NextResponse.json({ error: 'dreamId required' }, { status: 400 })
  }

  const [dream, projectionParams] = await Promise.all([
    db.dream.findUnique({
      where: { id: dreamId },
      include: { assets: true },
    }),
    db.projectionParams.findMany(),
  ])

  if (!dream) {
    return NextResponse.json({ error: 'Dream not found' }, { status: 404 })
  }

  const rateMap = new Map(projectionParams.map((p) => [p.assetCategory, p.annualRate]))
  const dreamAssets = dream.assets ?? []
  const currentProgress = dreamAssets.reduce((s, a) => s + Number(a.currentValue), 0)

  const totalAssets = dreamAssets.reduce((s, a) => s + Number(a.currentValue), 0)
  const baseAnnualRate =
    totalAssets > 0
      ? dreamAssets.reduce(
          (s, a) => s + (rateMap.get(a.type) ?? 0.09) * (Number(a.currentValue) / totalAssets),
          0
        )
      : 0.09

  const results = simulateDream({
    currentProgress,
    targetAmount: Number(dream.targetAmount),
    monthlyContribution: contribution,
    baseAnnualRate,
    targetDate: dream.targetDate ?? undefined,
  })

  return NextResponse.json({
    dream: {
      id: dream.id,
      name: dream.name,
      targetAmount: Number(dream.targetAmount),
      targetDate: dream.targetDate,
      currentProgress,
    },
    results,
  })
}
