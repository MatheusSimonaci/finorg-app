import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { MODERATE_TEMPLATE, ASSET_TYPE_LIST } from '@/lib/investments/constants'

/** GET /api/allocation-targets?mode=normal */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') ?? 'normal'

  const rows = await db.allocationTarget.findMany({ where: { mode } })

  // Build a full record seeded from MODERATE_TEMPLATE defaults
  const result: Record<string, number> = Object.fromEntries(
    ASSET_TYPE_LIST.map((t) => [t, MODERATE_TEMPLATE[t] ?? 0]),
  )
  for (const r of rows) {
    result[r.assetType] = r.targetPct
  }

  return NextResponse.json(result)
}

/** PUT /api/allocation-targets?mode=normal — body: Record<assetType, number> */
export async function PUT(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') ?? 'normal'
  const body = (await req.json()) as Record<string, number>

  const upserts = Object.entries(body).map(([assetType, targetPct]) =>
    db.allocationTarget.upsert({
      where: { assetType_mode: { assetType, mode } },
      create: { assetType, targetPct, mode },
      update: { targetPct },
    }),
  )

  await db.$transaction(upserts)
  return NextResponse.json({ ok: true })
}
