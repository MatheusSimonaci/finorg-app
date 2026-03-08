import { NextRequest, NextResponse } from "next/server"
import { prisma as db } from "@/lib/db"

export async function GET() {
  const rules = await db.classificationRule.findMany({
    orderBy: [{ source: "asc" }, { createdAt: "asc" }],
  })
  return NextResponse.json(rules)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { pattern, nature, category, subcategory, type } = body

  if (!pattern || !nature || !category) {
    return NextResponse.json({ error: "pattern, nature e category são obrigatórios" }, { status: 400 })
  }

  // Validate regex
  try {
    new RegExp(pattern)
  } catch {
    return NextResponse.json({ error: "pattern inválido — não é um regex válido" }, { status: 400 })
  }

  // Count preview: how many existing transactions this rule would match
  const transactions = await db.transaction.findMany({ select: { description: true } })
  const regex = new RegExp(pattern, "i")
  const matchCount = transactions.filter((t) => regex.test(t.description)).length

  const rule = await db.classificationRule.create({
    data: { pattern, nature, category, subcategory, type, source: "user", active: true },
  })

  return NextResponse.json({ ...rule, matchCount })
}

