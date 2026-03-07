import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { nature, category, subcategory, type, isReimbursable } = body

  const updated = await db.transaction.update({
    where: { id },
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
