import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: alertKey } = await params
  const body = await req.json().catch(() => ({}))
  const { reason } = body as { reason?: string }

  const snoozedUntil = new Date()
  snoozedUntil.setDate(snoozedUntil.getDate() + 30)

  const record = await db.snoozedAlert.upsert({
    where: { alertKey },
    update: { reason: reason ?? null, snoozedUntil },
    create: { alertKey, reason: reason ?? null, snoozedUntil },
  })

  return NextResponse.json({ ok: true, snoozedUntil: record.snoozedUntil })
}
