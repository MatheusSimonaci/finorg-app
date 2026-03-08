// Cash flow projection for the next 3 months

import type { DetectedRecurring } from './recurring-detector'

export interface RecurringExpenseItem {
  name: string
  amount: number // positive value (always an expense)
  category: string
  type: 'installment' | 'seasonal'
  monthOfYear?: number // 1-12 for seasonal
}

export interface MonthProjection {
  month: string // YYYY-MM
  label: string // e.g. "Março 2026"
  projectedIncome: number
  projectedFixed: number
  projectedInstallments: number
  projectedSeasonal: number
  estimatedBalance: number
  isNegative: boolean
  items: {
    description: string
    amount: number
    kind: 'income' | 'fixed' | 'installment' | 'seasonal'
  }[]
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  const my = d.getFullYear()
  const mm = d.getMonth() + 1
  return `${my}-${String(mm).padStart(2, '0')}`
}

function currentYM(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function buildCashflowProjection(
  recurring: DetectedRecurring[],
  dbRecurringExpenses: RecurringExpenseItem[],
): MonthProjection[] {
  const base = currentYM()
  const projections: MonthProjection[] = []

  for (let offset = 1; offset <= 3; offset++) {
    const month = addMonths(base, offset)
    const [y, m] = month.split('-').map(Number)
    const label = `${MONTH_NAMES[m - 1]} ${y}`

    let projectedIncome = 0
    let projectedFixed = 0
    let projectedInstallments = 0
    let projectedSeasonal = 0
    const items: MonthProjection['items'] = []

    // Detected recurring from history
    for (const r of recurring) {
      if (r.type === 'receita' && r.amount > 0) {
        projectedIncome += r.amount
        items.push({ description: r.description, amount: r.amount, kind: 'income' })
      } else if (r.type === 'gasto' && r.amount < 0) {
        const abs = Math.abs(r.amount)
        projectedFixed += abs
        items.push({ description: r.description, amount: -abs, kind: 'fixed' })
      }
    }

    // DB RecurringExpenses (installments & seasonal)
    for (const exp of dbRecurringExpenses) {
      if (exp.type === 'installment') {
        projectedInstallments += exp.amount
        items.push({ description: exp.name, amount: -exp.amount, kind: 'installment' })
      } else if (exp.type === 'seasonal' && exp.monthOfYear === m) {
        projectedSeasonal += exp.amount
        items.push({ description: exp.name, amount: -exp.amount, kind: 'seasonal' })
      }
    }

    const totalExpenses = projectedFixed + projectedInstallments + projectedSeasonal
    const estimatedBalance = projectedIncome - totalExpenses

    projections.push({
      month,
      label,
      projectedIncome,
      projectedFixed,
      projectedInstallments,
      projectedSeasonal,
      estimatedBalance,
      isNegative: estimatedBalance < 0,
      items,
    })
  }

  return projections
}
