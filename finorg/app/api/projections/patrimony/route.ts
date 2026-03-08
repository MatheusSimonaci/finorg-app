import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { projectPatrimony } from '@/lib/projections/patrimony-engine'
import type { ProjectionHorizon } from '@/lib/projections/patrimony-engine'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const horizon = (Number(searchParams.get('horizon') ?? 10)) as ProjectionHorizon
  const monthlyContribution = Number(searchParams.get('contribution') ?? 0)

  const [assets, projectionParams, globalParams, dreams] = await Promise.all([
    db.asset.findMany({ where: { active: true, purpose: 'personal' } }),
    db.projectionParams.findMany(),
    db.globalParams.findUnique({ where: { id: 'singleton' } }),
    db.dream.findMany({
      where: { status: { in: ['planejando', 'acumulando'] }, targetDate: { not: null } },
    }),
  ])

  const rateMap = new Map(projectionParams.map((p) => [p.assetCategory, p.annualRate]))

  const assetInputs = assets.map((a) => ({
    value: Number(a.currentValue),
    annualRate: rateMap.get(a.type) ?? 0.09,
  }))

  const inflationRate = globalParams?.inflationRate ?? 0.045

  const result = projectPatrimony({
    horizon,
    inflationRate,
    monthlyContribution,
    assets: assetInputs,
  })

  const dreamMarkers = dreams
    .filter((d) => d.targetDate)
    .map((d) => ({
      name: d.name,
      year: new Date(d.targetDate!).getFullYear(),
      targetAmount: Number(d.targetAmount),
    }))

  return NextResponse.json({ ...result, dreamMarkers, inflationRate, horizon })
}
