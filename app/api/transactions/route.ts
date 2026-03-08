import { NextRequest, NextResponse } from "next/server"
import { prisma as db } from "@/lib/db"
import { generateTransactionHash } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const batchId = searchParams.get("batchId")

  const where = batchId ? { importBatchId: batchId } : {}

  const transactions = await db.transaction.findMany({
    where,
    include: { account: true },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(
    transactions.map((t) => ({
      ...t,
      amount: parseFloat(t.amount.toString()),
    }))
  )
}

// POST — create a transaction manually
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, description, amount, accountId, nature, category, subcategory, type, isReimbursable } = body

  if (!date || !description || amount === undefined || !accountId) {
    return NextResponse.json({ error: "Campos obrigatórios: date, description, amount, accountId" }, { status: 400 })
  }

  const parsedAmount = parseFloat(amount)
  const hash = generateTransactionHash(
    new Date(date).toISOString().slice(0, 10),
    description,
    parsedAmount
  )

  const created = await db.transaction.create({
    include: { account: true },
    data: {
      date: new Date(date),
      description,
      amount: parsedAmount,
      accountId,
      nature: nature ?? null,
      category: category ?? null,
      subcategory: subcategory ?? null,
      type: type ?? null,
      isReimbursable: isReimbursable ?? false,
      hash,
      confidence: 1.0,
      classificationOverride: true,
      classificationSource: "manual",
      reviewStatus: "overridden",
      rawData: JSON.stringify({ manual: true }),
    },
  })

  return NextResponse.json({ ...created, amount: parseFloat(created.amount.toString()) }, { status: 201 })
}

