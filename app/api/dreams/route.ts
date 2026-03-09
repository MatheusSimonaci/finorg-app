import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

// GET /api/dreams — list all dreams ordered by priority
export async function GET() {
  const dreams = await db.dream.findMany({
    orderBy: { priorityOrder: 'asc' },
    include: {
      assets: { where: { active: true }, select: { id: true, name: true, type: true, currentValue: true } },
    },
  })
  return NextResponse.json(dreams)
}

// POST /api/dreams — create a new dream
export async function POST(req: Request) {
  const body = await req.json()
  const { name, targetAmount, targetDate, priorityOrder, notes } = body

  if (!name || !targetAmount) {
    return NextResponse.json({ error: 'name and targetAmount required' }, { status: 400 })
  }

  // Check if there's already an active dream
  const activeDream = await db.dream.findFirst({ where: { status: 'acumulando' } })

  // Get max priority if not provided
  const maxPriority = await db.dream.aggregate({ _max: { priorityOrder: true } })
  const order = priorityOrder ?? (maxPriority._max.priorityOrder ?? 0) + 1

  // First dream ever → automatically becomes 'acumulando'
  const firstDream = !activeDream && (await db.dream.count()) === 0

  const dream = await db.dream.create({
    data: {
      name: String(name).trim(),
      targetAmount: Number(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
      priorityOrder: Number(order),
      status: firstDream ? 'acumulando' : 'planejando',
      notes: notes ? String(notes).trim() : null,
    },
  })

  // If this is the only dream, mark as acumulando (already handled above)
  // If there's no active dream and this has the highest priority (order=1), promote it
  if (!activeDream && !firstDream) {
    const lowestPriority = await db.dream.findFirst({
      where: { status: 'planejando' },
      orderBy: { priorityOrder: 'asc' },
    })
    if (lowestPriority?.id === dream.id) {
      await db.dream.update({ where: { id: dream.id }, data: { status: 'acumulando' } })
      return NextResponse.json({ ...dream, status: 'acumulando' })
    }
  }

  return NextResponse.json(dream, { status: 201 })
}
