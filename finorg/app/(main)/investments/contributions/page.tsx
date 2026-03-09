'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Target } from 'lucide-react'
import { KpiCard } from '@/components/finance/kpi-card'
import { ContributionsChart } from '@/components/finance/contributions-chart'
import { EmptyState } from '@/components/finance/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCurrency, formatPct } from '@/lib/utils'
import { assetLabel, assetColor } from '@/lib/investments/constants'

type ContributionData = {
  chartData: Array<{ month: string; [key: string]: number | string }>
  assetTypes: string[]
  currentMonth: { total: number; goal: number; pctOfIncome: number; incomeTargetPct: number }
  byAsset: Array<{ id: string; name: string; type: string; monthContribution: number; totalContribution: number }>
}

const EMPTY_DATA: ContributionData = {
  chartData: [],
  assetTypes: [],
  currentMonth: { total: 0, goal: 0, pctOfIncome: 0, incomeTargetPct: 20 },
  byAsset: [],
}

export default function ContributionsPage() {
  const [d, setD] = useState<ContributionData>(EMPTY_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/investments/contributions')
      .then((r) => r.json())
      .then((data: ContributionData) => { setD(data); setLoading(false) })
  }, [])

  const hasData = d.chartData.length > 0

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Carregando aportes…</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Relatório de Aportes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Histórico e consistência de investimentos mensais
          </p>
        </div>
        <a href="/investments" className="text-xs text-primary hover:underline self-start pt-1">
          ← Voltar ao portfólio
        </a>
      </div>

      {!hasData ? (
        <EmptyState
          title="Sem histórico de aportes"
          description="Os aportes aparecerão aqui assim que transações do tipo 'investimento' forem classificadas."
          action={{ label: 'Importar transações', href: '/transactions' }}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Aportado este mês"
              value={formatCurrency(d.currentMonth.total)}
              icon={<TrendingUp className="h-4 w-4" />}
              variant="investment"
            />
            <KpiCard
              label="Meta mensal"
              value={formatCurrency(d.currentMonth.goal)}
              icon={<Target className="h-4 w-4" />}
              variant="default"
              subtext={d.currentMonth.goal > 0
                ? `${formatPct((d.currentMonth.total / d.currentMonth.goal) * 100)} atingido`
                : undefined}
            />
            <KpiCard
              label="% da renda investida"
              value={formatPct(d.currentMonth.pctOfIncome)}
              icon={<TrendingUp className="h-4 w-4" />}
              variant={d.currentMonth.pctOfIncome >= d.currentMonth.incomeTargetPct ? 'income' : 'default'}
              subtext={`Meta: ${formatPct(d.currentMonth.incomeTargetPct)}`}
            />
            <KpiCard
              label="Progresso vs. meta"
              value={d.currentMonth.goal > 0
                ? formatPct((d.currentMonth.total / d.currentMonth.goal) * 100)
                : '—'}
              variant="default"
            />
          </div>

          {/* Meta progress */}
          {d.currentMonth.goal > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground">Progresso da meta mensal</h2>
              <ProgressBar
                value={(d.currentMonth.total / d.currentMonth.goal) * 100}
                showPercent
                variant={d.currentMonth.total >= d.currentMonth.goal ? 'income' : 'investment'}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Aportado: {formatCurrency(d.currentMonth.total)}</span>
                <span>Meta: {formatCurrency(d.currentMonth.goal)}</span>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">Aportes mensais — 12 meses</h2>
            <ContributionsChart
              data={d.chartData}
              assetTypes={d.assetTypes}
            />
          </div>

          {/* Table by asset */}
          {d.byAsset.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Aportes por ativo</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ativo</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Este mês</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total histórico</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.byAsset.map((a) => (
                    <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: assetColor(a.type) }}
                          />
                          <div>
                            <p className="font-medium text-foreground">{a.name}</p>
                            <p className="text-xs text-muted-foreground">{assetLabel(a.type)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-foreground">
                        {formatCurrency(a.monthContribution)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-sm tabular-nums text-muted-foreground">
                        {formatCurrency(a.totalContribution)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
