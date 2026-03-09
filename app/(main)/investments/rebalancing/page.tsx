'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type RebalancingData = {
  state: 'equilibrada' | 'rebalanceando' | 'no_data'
  progress: number
  portfolioTotal: number
  rows: Array<{ assetType: string; currentPct: number; targetPct: number }>
  suggestions: Array<{ assetType: string; suggestedAmount: number; reason: string }>
  monthsEstimate: number
  lastDreamName: string | null
  lastDreamAchievedAt: string | null
}

const ASSET_LABELS: Record<string, string> = {
  tesouro: 'Tesouro Direto',
  cdb: 'CDB',
  lci: 'LCI/LCA',
  fii: 'FIIs',
  acoes: 'Ações',
  cripto: 'Cripto',
  previdencia: 'Previdência',
  fundo: 'Fundos',
  conta_remunerada: 'Conta Remunerada',
}

export default function RebalancingPage() {
  const router = useRouter()
  const [data, setData] = useState<RebalancingData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/investments/rebalancing')
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>

  if (!data || data.state === 'no_data') {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold">Rebalanceamento</h1>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum dado de rebalanceamento disponível. Configure metas de alocação no módulo de Investimentos.</p>
        </div>
      </div>
    )
  }

  const isBalanced = data.state === 'equilibrada'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rebalanceamento</h1>
          <p className="text-sm text-muted-foreground">
            {data.lastDreamName
              ? `Pós-realização: ${data.lastDreamName}`
              : 'Progresso de retorno ao equilíbrio'}
          </p>
        </div>
      </div>

      {/* State banner */}
      {isBalanced ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-800 dark:text-emerald-300">Carteira equilibrada ✓</p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">Todos os tipos de ativo estão dentro da tolerância de ±5% do alvo.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Progresso do rebalanceamento</span>
            </div>
            <span className="text-xl font-bold text-primary">{data.progress}%</span>
          </div>
          <ProgressBar value={data.progress} className="h-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {data.monthsEstimate > 0
              ? `Estimativa: rebalanceamento completo em ~${data.monthsEstimate} meses no ritmo atual`
              : 'Defina um aporte mensal para obter estimativa'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            ℹ️ Carteira desbalanceada pós-sonho <strong>não é um erro</strong> — é o estado esperado. Continue aportando normalmente.
          </p>
        </div>
      )}

      {/* Per-type breakdown */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-4">Por tipo de ativo</h2>
        <div className="space-y-3">
          {data.rows.map((row) => {
            const diff = row.currentPct - row.targetPct
            const isUnder = diff < -1
            const isOver = diff > 1
            return (
              <div key={row.assetType}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{ASSET_LABELS[row.assetType] ?? row.assetType}</span>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{row.currentPct.toFixed(1)}% atual</span>
                    <span>→</span>
                    <span>{row.targetPct.toFixed(1)}% alvo</span>
                    <span className={cn(
                      'font-semibold',
                      isUnder && 'text-amber-600 dark:text-amber-400',
                      isOver && 'text-blue-600 dark:text-blue-400',
                      !isUnder && !isOver && 'text-emerald-600 dark:text-emerald-400'
                    )}>
                      ({diff >= 0 ? '+' : ''}{diff.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', isUnder ? 'bg-amber-500' : isOver ? 'bg-blue-500' : 'bg-emerald-500')}
                    style={{ width: `${Math.min(100, (row.currentPct / Math.max(row.targetPct, row.currentPct, 1)) * 100).toFixed(0)}%` }}
                  />
                  {/* Target marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-foreground/30"
                    style={{ left: `${Math.min(100, (row.targetPct / Math.max(row.targetPct, row.currentPct, 1)) * 100).toFixed(0)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Suggestions */}
      {data.suggestions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Onde aportar para rebalancear mais rápido</h2>
          <div className="space-y-2">
            {data.suggestions.map((s) => (
              <div key={s.assetType} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{ASSET_LABELS[s.assetType] ?? s.assetType}</span>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </div>
                <span className="font-bold text-primary">{formatCurrency(s.suggestedAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
