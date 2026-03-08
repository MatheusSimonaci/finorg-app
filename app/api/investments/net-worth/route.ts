import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

type SnapshotWithType = { assetId: string; month: string; value: number; assetType: string; assetName: string }

/**
 * GET /api/investments/net-worth
 * Returns last 12 months of net-worth snapshots aggregated across all assets.
 */
export async function GET() {
  const snapshots = await db.assetSnapshot.findMany({
    include: { asset: { select: { type: true, name: true } } },
    orderBy: { month: 'asc' },
  })

  // Aggregate by month: sum of all asset values per month
  const byMonth: Record<string, number> = {}
  for (const s of snapshots) {
    byMonth[s.month] = (byMonth[s.month] ?? 0) + Number(s.value)
  }

  const months = Object.keys(byMonth).sort()

  const data = months.map((m) => {
    const [year, mo] = m.split('-')
    const date = new Date(Number(year), Number(mo) - 1, 1)
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    return { month: label, value: byMonth[m] }
  })

  return NextResponse.json(data)
}
