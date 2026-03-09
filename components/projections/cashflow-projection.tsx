'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { MonthProjection } from '@/lib/projections/cashflow-engine'

interface Props {
  projections: MonthProjection[]
}

const KIND_LABEL: Record<string, string> = {
  income: 'Receita',
  fixed: 'Gasto fixo',
  installment: 'Parcela',
  seasonal: 'Sazonal',
}

const KIND_CLS: Record<string, string> = {
  income: 'text-income',
  fixed: 'text-expense',
  installment: 'text-amber-600 dark:text-amber-400',
  seasonal: 'text-blue-600 dark:text-blue-400',
}

export function CashflowProjection({ projections }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (projections.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
        Dados insuficientes para projetar o fluxo de caixa. Importe ao menos 3 meses de extratos.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {projections.map((month) => {
        const isExpanded = expanded === month.month

        return (
          <div
            key={month.month}
            className={cn(
              'rounded-xl border overflow-hidden transition-colors',
              month.isNegative ? 'border-destructive/40' : 'border-border',
            )}
          >
            {/* Month header row */}
            <button
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors',
                month.isNegative ? 'bg-destructive/5' : 'bg-card',
              )}
              onClick={() => setExpanded(isExpanded ? null : month.month)}
            >
              <div className="flex items-center gap-3">
                {month.isNegative && <span className="text-base">⚠️</span>}
                <div className="text-left">
                  <p className="text-sm font-semibold">{month.label}</p>
                  <div className="flex gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="text-income">↑ {formatCurrency(month.projectedIncome)}</span>
                    <span className="text-expense">↓ {formatCurrency(month.projectedFixed + month.projectedInstallments + month.projectedSeasonal)}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn('text-sm font-mono font-bold', month.isNegative ? 'text-destructive' : 'text-income')}>
                  {month.estimatedBalance >= 0 ? '+' : ''}{formatCurrency(month.estimatedBalance)}
                </p>
                <p className="text-[10px] text-muted-foreground">{isExpanded ? '▲' : '▼'}</p>
              </div>
            </button>

            {/* Expanded items */}
            {isExpanded && (
              <div className="border-t divide-y bg-muted/10">
                {month.items.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground italic">Sem itens detalhados</p>
                ) : (
                  month.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2">
                      <div>
                        <p className="text-xs font-medium truncate max-w-[200px]">{item.description}</p>
                        <p className="text-[10px] text-muted-foreground">{KIND_LABEL[item.kind] ?? item.kind}</p>
                      </div>
                      <p className={cn('text-xs font-mono', KIND_CLS[item.kind])}>
                        {item.amount >= 0 ? '+' : ''}{formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))
                )}

                {/* Summary */}
                <div className="grid grid-cols-3 gap-2 px-4 py-3 bg-muted/20">
                  {month.projectedFixed > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground">Fixos</p>
                      <p className="text-xs font-mono text-expense">{formatCurrency(month.projectedFixed)}</p>
                    </div>
                  )}
                  {month.projectedInstallments > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground">Parcelas</p>
                      <p className="text-xs font-mono text-amber-600">{formatCurrency(month.projectedInstallments)}</p>
                    </div>
                  )}
                  {month.projectedSeasonal > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground">Sazonais</p>
                      <p className="text-xs font-mono text-blue-600">{formatCurrency(month.projectedSeasonal)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
