import { NextRequest, NextResponse } from "next/server"
import { prisma as db } from "@/lib/db"
import { generateTransactionHash } from "@/lib/utils"

// PATCH — update classification fields (inline row selects)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { nature, category, subcategory, type, isReimbursable } = body

  const updated = await db.transaction.update({
    where: { id },
    include: { account: true },
    data: {
      ...(nature !== undefined && { nature }),
      ...(category !== undefined && { category }),
      ...(subcategory !== undefined && { subcategory }),
      ...(type !== undefined && { type }),
      ...(isReimbursable !== undefined && { isReimbursable }),
      confidence: 1.0,
      classificationOverride: true,
      classificationSource: "manual",
      reviewStatus: "overridden",
    },
  })

  return NextResponse.json({ ...updated, amount: parseFloat(updated.amount.toString()) })
}

// PUT — full edit (date, description, amount + classification)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { date, description, amount, accountId, nature, category, subcategory, type, isReimbursable } = body

  const hash = generateTransactionHash(
    new Date(date).toISOString().slice(0, 10),
    description,
    parseFloat(amount)
  )

  const updated = await db.transaction.update({
    where: { id },
    include: { account: true },
    data: {
      ...(date !== undefined && { date: new Date(date) }),
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(accountId !== undefined && { accountId }),
      ...(nature !== undefined && { nature }),
      ...(category !== undefined && { category }),
      ...(subcategory !== undefined && { subcategory: subcategory || null }),
      ...(type !== undefined && { type }),
      ...(isReimbursable !== undefined && { isReimbursable }),
      hash,
      confidence: 1.0,
      classificationOverride: true,
      classificationSource: "manual",
      reviewStatus: "overridden",
    },
  })

  return NextResponse.json({ ...updated, amount: parseFloat(updated.amount.toString()) })
}

// DELETE — remove a transaction
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.transaction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
