'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PatrimonyChart } from '@/components/projections/patrimony-chart'
import { DreamSimulator } from '@/components/projections/dream-simulator'
import { CashflowProjection } from '@/components/projections/cashflow-projection'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { DisplayMode } from '@/components/projections/patrimony-chart'
import type { ProjectionHorizon } from '@/lib/projections/patrimony-engine'

const HORIZONS: { label: string; value: ProjectionHorizon }[] = [
  { label: '1 ano', value: 1 },
  { label: '3 anos', value: 3 },
  { label: '5 anos', value: 5 },
  { label: '10 anos', value: 10 },
  { label: '20 anos', value: 20 },
]

interface PatrimonyData {
  dataPoints: { label: string; nominalWith: number; nominalWithout: number; realWith: number; realWithout: number }[]
  dreamMarkers: { name: string; year: number; targetAmount: number }[]
  initialTotal: number
  finalWith: number
  finalWithout: number
  weightedAnnualRate: number
  inflationRate: number
}

interface CashflowData {
  projections: {
    month: string
    label: string
    projectedIncome: number
    projectedFixed: number
    projectedInstallments: number
    projectedSeasonal: number
    estimatedBalance: number
    isNegative: boolean
    items: { description: string; amount: number; kind: 'income' | 'fixed' | 'installment' | 'seasonal' }[]
  }[]
  detectedCount: number
}

interface Dream {
  id: string
  name: string
  targetAmount: number
  targetDate: string | null
}

export default function ProjectionsPage() {
  const [horizon, setHorizon] = useState<ProjectionHorizon>(10)
  const [contribution, setContribution] = useState(1000)
  const [displayMode, setDisplayMode] = useState<DisplayMode>('nominal')
  const [patrimony, setPatrimony] = useState<PatrimonyData | null>(null)
  const [cashflow, setCashflow] = useState<CashflowData | null>(null)
  const [dreams, setDreams] = useState<Dream[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPatrimony = useCallback(async (h: ProjectionHorizon, c: number) => {
    const res = await fetch(`/api/projections/patrimony?horizon=${h}&contribution=${c}`)
    if (res.ok) setPatrimony(await res.json())
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const [cashRes, dreamRes] = await Promise.all([
          fetch('/api/projections/cashflow'),
          fetch('/api/dreams'),
        ])
        if (cashRes.ok) setCashflow(await cashRes.json())
        if (dreamRes.ok) {
          const d = await dreamRes.json()
          setDreams(
            (d.dreams ?? d)
              .filter((dr: Dream & { status: string }) => ['planejando', 'acumulando'].includes(dr.status))
          )
        }
        await fetchPatrimony(10, 1000)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [fetchPatrimony])

  function handleHorizonChange(h: ProjectionHorizon) {
    setHorizon(h)
    fetchPatrimony(h, contribution)
  }

  function handleContributionChange(c: number) {
    setContribution(c)
    fetchPatrimony(horizon, c)
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 animate-pulse max-w-4xl mx-auto">
        <div className="h-8 bg-muted rounded w-40" />
        <div className="h-64 bg-muted rounded-xl" />
        <div className="h-48 bg-muted rounded-xl" />
      </div>
    )
  }

  const growthPct = patrimony && patrimony.initialTotal > 0
    ? ((patrimony.finalWith - patrimony.initialTotal) / patrimony.initialTotal) * 100
    : 0

  return (
    <div className="flex-1 p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projeções</h1>
        <Link href="/settings/projections">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Parâmetros
          </Button>
        </Link>
      </div>

      {/* ─── Patrimony Section ─── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold">Projeção de Patrimônio</h2>
          {/* Toggle nominal/real */}
          <div className="flex rounded-lg border overflow-hidden text-xs">
            {(['nominal', 'real'] as DisplayMode[]).map((m) => (
              <button
                key={m}
                className={cn('px-3 py-1.5 font-medium transition-colors', displayMode === m ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50')}
                onClick={() => setDisplayMode(m)}
              >
                {m === 'nominal' ? 'Nominal' : 'Real (inflation)'}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon pills */}
        <div className="flex gap-2 flex-wrap">
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => handleHorizonChange(h.value)}
              className={cn(
                'px-3 py-1 text-xs rounded-full border font-medium transition-colors',
                horizon === h.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:border-primary/50',
              )}
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* Summary KPIs */}
        {patrimony && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Hoje</p>
              <p className="text-base font-bold font-mono">{formatCurrency(patrimony.initialTotal)}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Em {horizon} ano(s)</p>
              <p className="text-base font-bold font-mono text-income">{formatCurrency(patrimony.finalWith)}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Crescimento</p>
              <p className="text-base font-bold font-mono text-income">+{growthPct.toFixed(0)}%</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Taxa ponderada</p>
              <p className="text-base font-bold">{(patrimony.weightedAnnualRate * 100).toFixed(1)}% a.a.</p>
            </div>
          </div>
        )}

        {/* Contribution slider */}
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-muted-foreground">
              Aporte mensal incluído na projeção
            </label>
            <span className="text-sm font-bold">{formatCurrency(contribution)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={250}
            value={contribution}
            onChange={(e) => handleContributionChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>R$0</span>
            <span>R$10.000</span>
          </div>
        </div>

        {/* Chart */}
        {patrimony && (
          <div className="rounded-xl border bg-card p-4">
            <PatrimonyChart
              data={patrimony.dataPoints}
              dreamMarkers={patrimony.dreamMarkers}
              displayMode={displayMode}
            />
            {patrimony.inflationRate > 0 && displayMode === 'real' && (
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                Valores ajustados por inflação de {(patrimony.inflationRate * 100).toFixed(1)}% a.a.
              </p>
            )}
          </div>
        )}
      </section>

      {/* ─── Dream Simulator ─── */}
      <section>
        <DreamSimulator dreams={dreams} />
      </section>

      {/* ─── Cash Flow Projection ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Fluxo de Caixa — Próximos 3 meses</h2>
          {cashflow && cashflow.detectedCount > 0 && (
            <span className="text-xs text-muted-foreground">{cashflow.detectedCount} gastos fixos detectados</span>
          )}
        </div>
        {cashflow && <CashflowProjection projections={cashflow.projections} />}
      </section>
    </div>
  )
}
