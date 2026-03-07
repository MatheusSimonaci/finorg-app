import type { BankParser, ParseResult } from "./types"
import { generateTransactionHash } from "@/lib/utils"
import { get, parseDate, parseAmount } from "./helpers"

export const nubankParser: BankParser = {
  bankName: "nubank",
  detect: (headers) => {
    // headers are pre-normalized (lowercased + NFD stripped) by index.ts
    const h = headers.join("|")
    // conta corrente: Data, Descrição, Valor
    if (h.includes("data") && h.includes("descri") && h.includes("valor")) return true
    // cartão de crédito: date, title, amount
    if (h.includes("date") && h.includes("title") && h.includes("amount")) return true
    return false
  },
  parse: (rows, accountId): ParseResult => {
    const transactions = []
    const parseErrors: { row: number; error: string }[] = []

    if (rows.length === 0) return { transactions, parseErrors }

    const firstRowKeys = Object.keys(rows[0]).map((k) => k.toLowerCase())
    const isCartao = firstRowKeys.includes("date") && firstRowKeys.includes("title")

    rows.forEach((row, i) => {
      try {
        let date: Date, description: string, amount: number

        if (isCartao) {
          date = parseDate(get(row, "date"))
          description = get(row, "title").trim()
          amount = parseAmount(get(row, "amount"))
        } else {
          date = parseDate(get(row, "Data", "data"))
          description = get(row, "Descrição", "Descricao", "Descri__o", "descricao").trim()
          amount = parseAmount(get(row, "Valor", "valor"))
        }

        if (!description) throw new Error("Descrição vazia")
        const hash = generateTransactionHash(date.toISOString().slice(0, 10), description, amount)
        transactions.push({ date, description, amount, accountId, rawData: JSON.stringify(row), hash })
      } catch (e) {
        parseErrors.push({ row: i + 2, error: String(e) })
      }
    })

    return { transactions, parseErrors }
  },
}
