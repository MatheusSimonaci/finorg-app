import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()
  const { startDate, amount, ...rest } = body

  const expense = await db.recurringExpense.update({
    where: { id },
    data: {
      ...rest,
      ...(amount != null ? { amount } : {}),
      ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
    },
  })

  return NextResponse.json({ ...expense, amount: Number(expense.amount) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  await db.recurringExpense.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
