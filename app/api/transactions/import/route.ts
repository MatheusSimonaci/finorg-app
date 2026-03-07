import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { parseCSV } from "@/lib/parsers"
import * as fs from "fs"
import * as path from "path"

function backupDatabase() {
  try {
    const dbPath = path.join(process.cwd(), "dev.db")
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, `${dbPath}.bak.${Date.now()}`)
    }
  } catch {
    // Non-blocking — backup failure should not stop import
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const accountIdOverride = formData.get("accountId") as string | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const csvText = await file.text()
    const { bank, result } = parseCSV(csvText, "__detect__")

    if (!bank) {
      return NextResponse.json({ error: result.parseErrors[0]?.error ?? "Formato inválido" }, { status: 422 })
    }

    // Find or create account for this bank
    let account = await db.account.findFirst({ where: { institution: bank } })
    if (!account) {
      account = await db.account.create({
        data: {
          name: bank.charAt(0).toUpperCase() + bank.slice(1),
          institution: bank,
          type: bank === "bitybank" ? "crypto" : bank === "xp" ? "investment" : "checking",
        },
      })
    }

    const accountId = accountIdOverride ?? account.id

    // Re-parse with correct accountId
    const { result: finalResult } = parseCSV(csvText, accountId)

    // Backup before writing
    backupDatabase()

    // Deduplicate
    const existingHashes = new Set(
      (await db.transaction.findMany({ select: { hash: true } })).map((t) => t.hash)
    )

    const toInsert = finalResult.transactions.filter((t) => !existingHashes.has(t.hash))
    const duplicates = finalResult.transactions.length - toInsert.length

    // Create import batch
    const batch = await db.importBatch.create({
      data: {
        fileName: file.name,
        bank,
        imported: toInsert.length,
        duplicates,
        errors: finalResult.parseErrors.length,
        status: "imported",
      },
    })

    // Insert transactions
    if (toInsert.length > 0) {
      await db.transaction.createMany({
        data: toInsert.map((t) => ({
          date: t.date,
          description: t.description,
          amount: t.amount,
          accountId: t.accountId,
          rawData: t.rawData,
          hash: t.hash,
          importBatchId: batch.id,
          reviewStatus: "pending",
        })),
      })
    }

    return NextResponse.json({
      batchId: batch.id,
      bank,
      imported: toInsert.length,
      duplicates,
      errors: finalResult.parseErrors.length,
      parseErrors: finalResult.parseErrors,
    })
  } catch (e) {
    console.error("[import]", e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
