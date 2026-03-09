import { NextRequest, NextResponse } from "next/server"
import { prisma as db } from "@/lib/db"
import { parseCSV } from "@/lib/parsers"
import { mapFileWithLLM } from "@/lib/ai/xlsx-mapper"
import { generateTransactionHash } from "@/lib/utils"
import * as XLSX from "xlsx"
import * as fs from "fs"
import * as path from "path"

const norm = (s: string) =>
  String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "")

type XlsxParsed = {
  csvText: string
  rawRows: string[][] // kept for LLM fallback
  referenceDate: string // YYYY-MM-DD extracted from the file header when possible
}

/** Read an XLS/XLSX buffer and return both a CSV string and the raw rows. */
function readXlsx(buffer: Buffer): XlsxParsed {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows: string[][] = (XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][]).map(
    (row) =>
      (row as unknown[]).map((cell) => {
        if (cell instanceof Date) {
          return `${String(cell.getDate()).padStart(2, "0")}/${String(cell.getMonth() + 1).padStart(2, "0")}/${cell.getFullYear()}`
        }
        return String(cell ?? "")
      })
  )

  // Try to extract a reference date from the first few rows (e.g. "08/03/2026")
  let referenceDate = new Date().toISOString().slice(0, 10)
  const dateRe = /(\d{2})\/(\d{2})\/(\d{4})/
  for (const row of rawRows.slice(0, 6)) {
    for (const cell of row) {
      const m = cell.match(dateRe)
      if (m) {
        referenceDate = `${m[3]}-${m[2]}-${m[1]}`
        break
      }
    }
  }

  // Locate the header row
  const dateKeywords = ["data", "date", "dt"]
  const descKeywords = ["historico", "descricao", "description", "titulo", "memo",
    "lancamento", "credito", "debito", "amount", "valor", "posicao"]
  let headerIdx = 0
  for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
    const n = rawRows[i].map(norm)
    if (
      n.some((c) => dateKeywords.some((k) => c === k || c.startsWith(k))) &&
      n.some((c) => descKeywords.some((k) => c === k || c.startsWith(k)))
    ) {
      headerIdx = i
      break
    }
  }

  const csvRows = rawRows.slice(headerIdx).filter((r) => r.some((c) => c.trim() !== ""))
  const csvText = csvRows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell)
          return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s
        })
        .join(",")
    )
    .join("\n")

  return { csvText, rawRows, referenceDate }
}

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

/** Detect CSV delimiter (semicolon vs comma) and split into 2-D array */
function detectDelimiterAndSplit(csvText: string): string[][] {
  const normalized = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const firstLines = normalized.split("\n").slice(0, 5).join("\n")
  const semicolons = (firstLines.match(/;/g) ?? []).length
  const commas = (firstLines.match(/,/g) ?? []).length
  const delimiter = semicolons > commas ? ";" : ","
  return normalized
    .trim()
    .split("\n")
    .map((line) => line.split(delimiter))
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const accountIdOverride = formData.get("accountId") as string | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    const isXlsx = ext === "xls" || ext === "xlsx"

    // --- Path A: CSV or XLSX that maps cleanly to a known parser ---
    let csvText = ""
    let xlsxParsed: XlsxParsed | null = null

    if (isXlsx) {
      const arrayBuffer = await file.arrayBuffer()
      xlsxParsed = readXlsx(Buffer.from(arrayBuffer))
      csvText = xlsxParsed.csvText
    } else {
      csvText = await file.text()
    }

    const { bank, result } = parseCSV(csvText, "__detect__")

    // --- Path B: known parser failed → LLM fallback (XLSX or CSV) ---
    if (!bank) {
      const rows: string[][] = isXlsx && xlsxParsed
        ? xlsxParsed.rawRows
        : detectDelimiterAndSplit(csvText)
      const refDate = (isXlsx && xlsxParsed?.referenceDate) || new Date().toISOString().slice(0, 10)

      console.log(`[import] Standard parsers failed on ${isXlsx ? "XLSX" : "CSV"} — trying LLM mapper`)
      const llmResult = await mapFileWithLLM(rows, refDate)

      if (!llmResult.ok) {
        return NextResponse.json(
          { error: llmResult.error },
          { status: 422 }
        )
      }

      const detectedBank = llmResult.bankName.toLowerCase().replace(/\s+/g, "-")
      const detectedName = llmResult.bankName

      // Detect if this is investment/portfolio data (many position entries)
      const isPortfolio = llmResult.transactions.some(t => t.description.startsWith("Posição") || t.quantity !== undefined)

      // Find / create account for the detected bank
      let account = await db.account.findFirst({ where: { institution: detectedBank } })
      if (!account) {
        account = await db.account.create({
          data: { name: detectedName, institution: detectedBank, type: isPortfolio ? "investment" : "checking" },
        })
      }
      const accountId = accountIdOverride ?? account.id

      const existingHashes = new Set(
        (await db.transaction.findMany({ select: { hash: true } })).map((t) => t.hash)
      )

      const toInsert = llmResult.transactions
        .map((t) => ({
          date: new Date(t.date),
          description: t.description,
          amount: t.amount,
          quantity: t.quantity ?? null,
          unitPrice: t.unitPrice ?? null,
          type: (t.quantity !== undefined || t.description.startsWith("Posição")) ? "investimento" : null as string | null,
          accountId,
          rawData: t.rawData,
          hash: generateTransactionHash(t.date, t.description, t.amount),
        }))
        .filter((t) => !existingHashes.has(t.hash))

      const duplicates = llmResult.transactions.length - toInsert.length

      backupDatabase()

      const batch = await db.importBatch.create({
        data: {
          fileName: file.name,
          bank: detectedBank,
          imported: toInsert.length,
          duplicates,
          errors: 0,
          status: "imported",
        },
      })

      if (toInsert.length > 0) {
        await db.transaction.createMany({
          data: toInsert.map((t) => ({ ...t, importBatchId: batch.id, reviewStatus: "pending" })),
        })
      }

      // --- Opening balance reconciliation ---
      // If the file declares a BRL closing balance AND this is a brand-new account
      // (no prior transactions), check if the sum of imported transactions matches.
      // If not, create a "Saldo anterior" entry to reconcile.
      if (
        llmResult.closingBalanceBRL !== undefined &&
        llmResult.closingBalanceBRL !== null
      ) {
        const priorTxCount = await db.transaction.count({
          where: { accountId, importBatchId: { not: batch.id } },
        })
        if (priorTxCount === 0) {
          const importedSum = toInsert.reduce((s, t) => s + t.amount, 0)
          const diff = Math.round((llmResult.closingBalanceBRL - importedSum) * 100) / 100
          if (Math.abs(diff) > 0.009) {
            // The earliest date in the file minus one day
            const dates = toInsert.map((t) => t.date.getTime())
            const earliestMs = dates.length ? Math.min(...dates) : Date.now()
            const balanceDate = new Date(earliestMs - 86_400_000)
            const balanceHash = generateTransactionHash(
              balanceDate.toISOString().slice(0, 10),
              "Saldo anterior",
              diff
            )
            if (!existingHashes.has(balanceHash)) {
              await db.transaction.create({
                data: {
                  date: balanceDate,
                  description: "Saldo anterior",
                  amount: diff,
                  accountId,
                  rawData: JSON.stringify({ source: "opening-balance", closingBalance: llmResult.closingBalanceBRL }),
                  hash: balanceHash,
                  importBatchId: batch.id,
                  reviewStatus: "pending",
                },
              })
            }
          }
        }
      }

      return NextResponse.json({
        batchId: batch.id,
        bank: detectedBank,
        imported: toInsert.length,
        duplicates,
        errors: 0,
        parseErrors: [],
        llmMapped: true,
      })
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

