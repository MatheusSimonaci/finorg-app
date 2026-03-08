import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name, subtype, institution, purpose, active, dreamId } = body

  const asset = await db.asset.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(subtype !== undefined && { subtype: subtype ? String(subtype) : null }),
      ...(institution !== undefined && { institution: String(institution).trim() }),
      ...(purpose !== undefined && { purpose: String(purpose) }),
      ...(active !== undefined && { active: Boolean(active) }),
      ...(dreamId !== undefined && { dreamId: dreamId || null }),
    },
  })
  return NextResponse.json(asset)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const asset = await db.asset.update({
    where: { id },
    data: { active: false },
  })
  return NextResponse.json(asset)
}
