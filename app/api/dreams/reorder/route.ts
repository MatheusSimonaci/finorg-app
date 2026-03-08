import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

// PATCH /api/dreams/reorder — update priority orders after drag-and-drop
// Body: { order: string[] } — array of dream IDs in new order
export async function PATCH(req: Request) {
  const { order } = await req.json()

  if (!Array.isArray(order) || order.length === 0) {
    return NextResponse.json({ error: 'order array required' }, { status: 400 })
  }

  await db.$transaction(
    order.map((id: string, index: number) =>
      db.dream.update({
        where: { id },
        data: { priorityOrder: index + 1 },
      })
    )
  )

  // Ensure the correct dream is ACUMULANDO after reorder
  // The one at priority 1 that is not realizado/arquivado should be acumulando
  const allActive = await db.dream.findMany({
    where: { status: { in: ['planejando', 'acumulando'] } },
    orderBy: { priorityOrder: 'asc' },
  })

  if (allActive.length > 0) {
    const shouldBeActive = allActive[0]
    // Demote any current acumulando that isn't the top
    for (const d of allActive) {
      if (d.id === shouldBeActive.id && d.status !== 'acumulando') {
        await db.dream.update({ where: { id: d.id }, data: { status: 'acumulando' } })
      } else if (d.id !== shouldBeActive.id && d.status === 'acumulando') {
        await db.dream.update({ where: { id: d.id }, data: { status: 'planejando' } })
      }
    }
  }

  const updated = await db.dream.findMany({ orderBy: { priorityOrder: 'asc' } })
  return NextResponse.json(updated)
}
