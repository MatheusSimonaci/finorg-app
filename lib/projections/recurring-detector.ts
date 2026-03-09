// Detect recurring transactions from transaction history
// A transaction is recurring if same description + similar amount (±10%)
// appears in 3+ distinct months

export interface DetectedRecurring {
  description: string
  amount: number // negative = expense, positive = income
  category: string
  type: string // gasto | receita
  occurrenceCount: number
}

interface TxSample {
  description: string
  amount: number // as JS number (can be negative)
  category: string
  type: string
  month: string // YYYY-MM
}

function normalizeDesc(desc: string): string {
  return desc.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function detectRecurring(transactions: TxSample[]): DetectedRecurring[] {
  // Group by normalized description
  const groups = new Map<string, TxSample[]>()

  for (const tx of transactions) {
    const key = normalizeDesc(tx.description)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(tx)
  }

  const results: DetectedRecurring[] = []

  for (const [, txs] of groups) {
    if (txs.length < 3) continue

    // Count distinct months
    const months = new Set(txs.map((t) => t.month))
    if (months.size < 3) continue

    // Median amount
    const amounts = txs.map((t) => t.amount).sort((a, b) => a - b)
    const medianAmount = amounts[Math.floor(amounts.length / 2)]

    // Check all amounts are within ±10% of median
    const allClose = amounts.every(
      (a) => medianAmount === 0 || Math.abs((a - medianAmount) / medianAmount) <= 0.1
    )
    if (!allClose) continue

    const tx0 = txs[0]
    results.push({
      description: tx0.description,
      amount: medianAmount,
      category: tx0.category,
      type: tx0.type,
      occurrenceCount: months.size,
    })
  }

  return results
}
