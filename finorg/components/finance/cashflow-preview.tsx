'use client'

import { addMonth, formatMonth } from '@/lib/date-utils'
import { CATEGORY_LABELS } from '@/lib/constants'

type RecurringItem = {
  id: string
  name: string
  type: string
  amount: number
  category: string
  totalInstallments: number | null
  currentInstallment: number | null
  startDate: string | null
  monthOfYear: number | null
}

interface CashflowPreviewProps {
  expenses: RecurringItem[]
  averageIncome: number
  currentMonth: string
}

function getExpensesForMonth(expenses: RecurringItem[], targetMonth: string): RecurringItem[] {
  const [year, mo] = targetMonth.split('-').map(Number)

  return expenses.filter((exp) => {
    if (exp.type === 'installment') {
      if (!exp.startDate || exp.currentInstallment == null || exp.totalInstallments == null) {
        return false
      }
      const start = new Date(exp.startDate)
      const startYear = start.getFullYear()
      const startMo = start.getMonth() + 1

      // 0-indexed installment for target month
      const monthDiff = (year - startYear) * 12 + (mo - startMo)
      return monthDiff >= exp.currentInstallment && monthDiff < exp.totalInstallments
    }

    if (exp.type === 'seasonal') {
      return exp.monthOfYear === mo
    }

    return false
  })
}

export function CashflowPreview({ expenses, averageIncome, currentMonth }: CashflowPreviewProps) {
  const months = [
    addMonth(currentMonth, 1),
    addMonth(currentMonth, 2),
    addMonth(currentMonth, 3),
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {months.map((month) => {
        const monthExpenses = getExpensesForMonth(expenses, month)
        const total = monthExpenses.reduce((s, e) => s + e.amount, 0)
        const pctOfIncome = averageIncome > 0 ? (total / averageIncome) * 100 : 0

        return (
          <div key={month} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{formatMonth(month)}</h3>
              {pctOfIncome > 0 && (
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    pctOfIncome > 30
                      ? 'bg-expense/10 text-expense'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {pctOfIncome.toFixed(0)}% da renda
                </span>
              )}
            </div>

            {monthExpenses.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum compromisso cadastrado</p>
            ) : (
              <ul className="space-y-2">
                {monthExpenses.map((exp) => (
                  <li key={exp.id} className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-foreground">{exp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[exp.category] || exp.category}
                        {exp.type === 'installment' &&
                          exp.totalInstallments != null &&
                          exp.currentInstallment != null && (
                            <span>
                              {' '}
                              · p. {exp.currentInstallment + 1}/{exp.totalInstallments}
                            </span>
                          )}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">
                      {exp.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {total > 0 && (
              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Total comprometido</span>
                <span className="font-semibold text-foreground">
                  {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
