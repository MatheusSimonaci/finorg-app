import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: NextRequest) {
  const { batchId } = await req.json()

  const result = await db.transaction.updateMany({
    where: {
      importBatchId: batchId,
      reviewStatus: "pending",
      confidence: { gte: 0.75 },
    },
    data: { reviewStatus: "approved" },
  })

  // Mark batch as confirmed if no more pending
  const pendingCount = await db.transaction.count({
    where: { importBatchId: batchId, reviewStatus: "pending" },
  })

  if (pendingCount === 0) {
    await db.importBatch.update({
      where: { id: batchId },
      data: { status: "confirmed" },
    })
  }

  return NextResponse.json({ approved: result.count, remaining: pendingCount })
}
