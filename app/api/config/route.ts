import { NextRequest, NextResponse } from "next/server"
import { prisma as db } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const key = searchParams.get("key")

  if (key) {
    const config = await db.appConfig.findUnique({ where: { key } })
    if (!config) return NextResponse.json({ value: null })
    // Mask sensitive keys
    const isSensitive = key.toLowerCase().includes("key") || key.toLowerCase().includes("token")
    return NextResponse.json({
      key: config.key,
      value: isSensitive ? `****${config.value.slice(-4)}` : config.value,
    })
  }

  const all = await db.appConfig.findMany()
  return NextResponse.json(all)
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json()
  if (!key || value === undefined) {
    return NextResponse.json({ error: "key e value são obrigatórios" }, { status: 400 })
  }
  const config = await db.appConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
  return NextResponse.json({ key: config.key, saved: true })
}

