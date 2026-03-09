'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Settings } from 'lucide-react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { BudgetHistoryChart } from '@/components/finance/budget-history-chart'
import { currentMonth, addMonth, formatMonth, lastNMonths } from '@/lib/date-utils'

type CategoryData = {
  category: string
  label: string
  spent: number
  limit: number
  pct: number
  targetPct: number
  alertThresholdPct: number
  transactions: Array<{ id: string; date: string; description: string; amount: number }>
}

type SummaryData = {
  month: string
  personalIncome: number
  categories: CategoryData[]
}

type HistoryData = {
  months: Record<string, number | string>[]
  categories: string[]
}

export default function BudgetPage() {
  const [month, setMonth] = useState(currentMonth())
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)

  const isCurrentMonth = month === currentMonth()
  const availableMonths = lastNMonths(6)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    Promise.all([
      fetch(`/api/budget/summary?month=${month}`).then((r) => r.json()),
      fetch(`/api/budget/history?to=${month}`).then((r) => r.json()),
    ])
      .then(([sum, hist]: [SummaryData, HistoryData]) => {
        setSummary(sum)
        setHistory(hist)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [month])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const getBarVariant = (pct: number, threshold: number) => {
    if (pct > 100) return 'danger' as const
    if (pct >= threshold) return 'warning' as const
    return 'default' as const
  }

  const canGoBack = availableMonths.includes(addMonth(month, -1))

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Orçamento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary
              ? `Renda pessoal: ${fmt(summary.personalIncome)}`
              : 'Acompanhamento de gastos por categoria'}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMonth(addMonth(month, -1))}
              disabled={!canGoBack}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 rounded-md bg-muted text-foreground font-medium min-w-[130px] text-center text-sm">
              {formatMonth(month)}
              {isCurrentMonth && <span className="ml-1 text-xs text-primary">●</span>}
            </span>
            <button
              onClick={() => setMonth(addMonth(month, 1))}
              disabled={isCurrentMonth}
              className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link
            href="/budget/settings"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/70 text-sm text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Configurar
          </Link>
        </div>
      </div>

      {/* Category list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-muted/20 h-20 animate-pulse" />
          ))}
        </div>
      ) : !summary || summary.categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm font-medium text-foreground mb-1">Sem dados de orçamento</p>
          <p className="text-xs text-muted-foreground mb-4">
            Configure seu orçamento para ver os limites por categoria.
          </p>
          <Link href="/budget/settings" className="text-xs text-primary hover:underline">
            Configurar orçamento →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {summary.categories.map((cat) => (
            <div key={cat.category} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setExpandedCat(expandedCat === cat.category ? null : cat.category)}
                className="w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">
                    {cat.label}
                    {cat.pct > 100 && (
                      <span className="ml-2 text-xs font-medium text-expense">● acima do limite</span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {fmt(cat.spent)} / {cat.limit > 0 ? fmt(cat.limit) : 'sem limite'}
                    </span>
                    {expandedCat === cat.category ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <ProgressBar
                  value={Math.min(cat.pct, 100)}
                  variant={getBarVariant(cat.pct, cat.alertThresholdPct)}
                  size="sm"
                  showPercent
                />
              </button>

              {expandedCat === cat.category && cat.transactions.length > 0 && (
                <div className="border-t border-border px-5 py-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Transações ({cat.transactions.length})
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {cat.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between gap-2 text-xs">
                        <span className="text-muted-foreground truncate">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} — {tx.description}
                        </span>
                        <span className="text-foreground font-medium whitespace-nowrap">
                          {fmt(Math.abs(tx.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* History chart */}
      {history && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Histórico de gastos (6 meses)</h2>
          <BudgetHistoryChart data={history.months} categories={history.categories} />
        </div>
      )}

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/budget/settings" className="text-primary hover:underline">
          Configurar metas →
        </Link>
        <Link href="/budget/recurring" className="text-primary hover:underline">
          Parcelas e sazonais →
        </Link>
      </div>
    </div>
  )
}
