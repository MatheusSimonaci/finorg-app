import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

/** PATCH /api/assets/[id]/value — update current value and upsert monthly snapshot */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { value } = body

  if (value === undefined || isNaN(Number(value))) {
    return NextResponse.json({ error: 'value is required' }, { status: 400 })
  }

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [asset] = await db.$transaction([
    db.asset.update({
      where: { id },
      data: {
        currentValue: Number(value),
        lastUpdated: now,
      },
    }),
    db.assetSnapshot.upsert({
      where: { assetId_month: { assetId: id, month } },
      create: { assetId: id, month, value: Number(value) },
      update: { value: Number(value) },
    }),
  ])

  return NextResponse.json(asset)
}
