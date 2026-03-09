import type { BankParser, ParseResult } from "./types"
import { generateTransactionHash } from "@/lib/utils"
import { get, parseDate, parseAmount } from "./helpers"

export const xpParser: BankParser = {
  bankName: "xp",
  detect: (headers) => {
    const h = headers.join("|")
    return h.includes("historico") || (h.includes("credito") && h.includes("debito"))
  },
  parse: (rows, accountId): ParseResult => {
    const transactions: import('./types').NormalizedTransaction[] = []
    const parseErrors: { row: number; error: string }[] = []

    rows.forEach((row, i) => {
      try {
        const dateVal = get(row, "Data", "data")
        const hist = get(row, "Histórico", "Historico", "historico")
        const credVal = get(row, "Crédito", "Credito", "credito")
        const debVal = get(row, "Débito", "Debito", "debito")

        if (!dateVal || !hist) throw new Error("Linha incompleta (Data ou Histórico vazio)")

        const date = parseDate(dateVal)
        const description = hist.trim()
        const cred = credVal ? parseAmount(credVal) : 0
        const deb = debVal ? parseAmount(debVal) : 0
        // Crédito = entrada (positivo), Débito = saída (negativo)
        const amount = cred > 0 ? cred : deb > 0 ? -deb : 0

        const hash = generateTransactionHash(date.toISOString().slice(0, 10), description, amount)
        transactions.push({ date, description, amount, accountId, rawData: JSON.stringify(row), hash })
      } catch (e) {
        parseErrors.push({ row: i + 2, error: String(e) })
      }
    })

    return { transactions, parseErrors }
  },
}
