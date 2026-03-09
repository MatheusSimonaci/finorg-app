import type { BankParser, ParseResult } from "./types"
import { generateTransactionHash } from "@/lib/utils"
import { get, parseDate, parseAmount } from "./helpers"

export const biybankParser: BankParser = {
  bankName: "bitybank",
  detect: (headers) => {
    const h = headers.join("|")
    return h.includes("moeda") || h.includes("totalbrl") || (h.includes("tipo") && h.includes("totalbrl"))
  },
  parse: (rows, accountId): ParseResult => {
    const transactions: import('./types').NormalizedTransaction[] = []
    const parseErrors: { row: number; error: string }[] = []

    rows.forEach((row, i) => {
      try {
        const dateVal = get(row, "Data", "data", "Date", "date")
        const tipo = get(row, "Tipo", "tipo", "Type", "type")
        const moeda = get(row, "Moeda", "moeda", "Ativo", "ativo")
        const totalBRL = get(row, "Total BRL", "TotalBRL", "totalbrl", "Total", "Valor BRL")

        if (!dateVal || !totalBRL) throw new Error("Linha incompleta")

        const date = parseDate(dateVal)
        const description = [tipo, moeda].filter(Boolean).join(" ").trim() || "Transação Bitybank"
        const rawAmount = parseAmount(totalBRL)
        // Compra = saída de BRL (negativo), Venda/Resgate = entrada (positivo)
        const amount = tipo.toLowerCase().includes("compra")
          ? -Math.abs(rawAmount)
          : Math.abs(rawAmount)

        const hash = generateTransactionHash(date.toISOString().slice(0, 10), description, amount)
        transactions.push({ date, description, amount, accountId, rawData: JSON.stringify(row), hash })
      } catch (e) {
        parseErrors.push({ row: i + 2, error: String(e) })
      }
    })

    return { transactions, parseErrors }
  },
}
