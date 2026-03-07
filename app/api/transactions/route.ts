import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

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
