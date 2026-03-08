import { NextResponse } from "next/server"
import { prisma as db } from "@/lib/db"

export async function GET() {
  const accounts = await db.account.findMany({ orderBy: { name: "asc" } })
  return NextResponse.json(accounts)
}
