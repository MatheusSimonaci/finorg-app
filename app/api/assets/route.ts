import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function GET() {
  const assets = await db.asset.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(assets)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, type, subtype, institution, currentValue, purpose } = body

  if (!name || !type || !institution) {
    return NextResponse.json({ error: 'name, type, institution are required' }, { status: 400 })
  }

  const asset = await db.asset.create({
    data: {
      name: String(name).trim(),
      type: String(type),
      subtype: subtype ? String(subtype) : null,
      institution: String(institution).trim(),
      currentValue: Number(currentValue) || 0,
      purpose: purpose ?? 'personal',
      lastUpdated: new Date(),
    },
  })
  return NextResponse.json(asset, { status: 201 })
}
