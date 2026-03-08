import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

// GET /api/dreams/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dream = await db.dream.findUnique({
    where: { id },
    include: {
      assets: { where: { active: true } },
      rebalancingSnapshots: { orderBy: { createdAt: 'desc' } },
    },
  })
  if (!dream) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(dream)
}

// PUT /api/dreams/[id] — update dream fields
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const { name, targetAmount, targetDate, priorityOrder, notes } = body

  const dream = await db.dream.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: String(name).trim() }),
      ...(targetAmount !== undefined && { targetAmount: Number(targetAmount) }),
      ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
      ...(priorityOrder !== undefined && { priorityOrder: Number(priorityOrder) }),
      ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
    },
  })
  return NextResponse.json(dream)
}

// DELETE /api/dreams/[id] — archive (soft delete)
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const dream = await db.dream.findUnique({ where: { id } })
  if (!dream) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wasActive = dream.status === 'acumulando'

  await db.dream.update({
    where: { id },
    data: { status: 'arquivado', archivedAt: new Date() },
  })

  // Promote next if this was the active dream
  if (wasActive) {
    const next = await db.dream.findFirst({
      where: { status: 'planejando' },
      orderBy: { priorityOrder: 'asc' },
    })
    if (next) {
      await db.dream.update({ where: { id: next.id }, data: { status: 'acumulando' } })
    }
  }

  return NextResponse.json({ success: true })
}
