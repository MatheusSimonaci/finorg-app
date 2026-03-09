import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

// PATCH /api/dreams/[id]/status — change dream status (archive, resume to planejando)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()

  const allowed = ['planejando', 'arquivado']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Use /realize for completing a dream' }, { status: 400 })
  }

  const dream = await db.dream.findUnique({ where: { id } })
  if (!dream) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const wasActive = dream.status === 'acumulando'

  const updated = await db.dream.update({
    where: { id },
    data: {
      status,
      ...(status === 'arquivado' && { archivedAt: new Date() }),
      ...(status === 'planejando' && { archivedAt: null }),
    },
  })

  // If was active and now archived/planejando, promote next
  if (wasActive) {
    const next = await db.dream.findFirst({
      where: { status: 'planejando' },
      orderBy: { priorityOrder: 'asc' },
    })
    if (next) {
      await db.dream.update({ where: { id: next.id }, data: { status: 'acumulando' } })
    }
  }

  // If setting to planejando and no active dream, promote this one
  if (status === 'planejando') {
    const active = await db.dream.findFirst({ where: { status: 'acumulando' } })
    if (!active) {
      const toPromote = await db.dream.findFirst({
        where: { status: 'planejando' },
        orderBy: { priorityOrder: 'asc' },
      })
      if (toPromote) {
        await db.dream.update({ where: { id: toPromote.id }, data: { status: 'acumulando' } })
      }
    }
  }

  return NextResponse.json(updated)
}
