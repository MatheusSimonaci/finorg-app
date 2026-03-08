'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw, Coins, Link2, Link2Off } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { KpiCard } from '@/components/finance/kpi-card'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import { calculateMonthsToGoal, addMonths } from '@/lib/dreams/calculator'

type ActiveDream = {
  id: string
  name: string
  targetAmount: number
  targetDate: string | null
  status: string
  notes: string | null
  earmarked: number
  progress: number
  requiredMonthly: number | null
  monthsLeft: number | null
  assets: Array<{ id: string; name: string; type: string; currentValue: number; dreamId: string | null }>
}

type AssetRow = { id: string; name: string; type: string; currentValue: number; dreamId: string | null }

export default function DreamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [dream, setDream] = useState<ActiveDream | null>(null)
  const [allAssets, setAllAssets] = useState<AssetRow[]>([])
  const [loading, setLoading] = useState(true)
  const [simInput, setSimInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, a] = await Promise.all([
        fetch(`/api/dreams/${id}`).then((r) => r.json()),
        fetch('/api/assets').then((r) => r.json()),
      ])
      // Compute earmarked from the full dream data
      const rawAssets = Array.isArray(a) ? a : a.assets ?? []
      const earmarked = (d.assets ?? []).reduce((s: number, x: AssetRow) => s + Number(x.currentValue), 0)
      const progress = d.targetAmount > 0 ? Math.min(100, (earmarked / Number(d.targetAmount)) * 100) : 0
      setDream({ ...d, targetAmount: Number(d.targetAmount), earmarked, progress })
      setAllAssets(rawAssets.map((x: AssetRow) => ({ ...x, currentValue: Number(x.currentValue) })))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function toggleAsset(asset: AssetRow) {
    const isDesignated = asset.dreamId === id
    await fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dreamId: isDesignated ? null : id, purpose: isDesignated ? 'personal' : 'dream' }),
    })
    load()
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Carregando…</div>
  if (!dream) return <div className="p-6 text-sm text-destructive">Sonho não encontrado.</div>

  const available = allAssets.filter((a) => !a.dreamId || a.dreamId === id)
  const simMonths = simInput ? calculateMonthsToGoal(dream.targetAmount, dream.earmarked, parseFloat(simInput.replace(',', '.'))) : null
  const simDate = simMonths !== null && isFinite(simMonths) ? addMonths(new Date(), simMonths) : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{dream.name}</h1>
          <p className="text-sm text-muted-foreground">Painel de acumulação</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Valor alvo" value={formatCurrency(dream.targetAmount)} />
        <KpiCard label="Já reservado" value={formatCurrency(dream.earmarked)} />
        <KpiCard label="Falta" value={formatCurrency(Math.max(0, dream.targetAmount - dream.earmarked))} />
        {dream.requiredMonthly !== null && (
          <KpiCard label="Aporte/mês necessário" value={formatCurrency(dream.requiredMonthly)} />
        )}
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Progresso</span>
          <span className="font-bold text-primary">{dream.progress.toFixed(1)}%</span>
        </div>
        <ProgressBar value={dream.progress} className="h-3" />
        {dream.targetDate && (
          <p className="mt-2 text-xs text-muted-foreground">
            Prazo: {new Date(dream.targetDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            {dream.monthsLeft !== null && (
              <span> · {dream.monthsLeft > 0 ? `${dream.monthsLeft} meses restantes` : 'Prazo vencido'}</span>
            )}
          </p>
        )}
        {dream.notes && <p className="mt-2 text-xs text-muted-foreground italic">{dream.notes}</p>}
      </div>

      {/* Simulator */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3">Simulador de aporte</h2>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Se eu aportar R$/mês a mais:</label>
            <input
              type="number"
              value={simInput}
              onChange={(e) => setSimInput(e.target.value)}
              placeholder="ex: 500"
              min="0"
              step="0.01"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {simMonths !== null && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Alcança em</p>
              {isFinite(simMonths) ? (
                <>
                  <p className="text-lg font-bold text-primary">{simMonths} meses</p>
                  {simDate && (
                    <p className="text-xs text-muted-foreground">
                      {simDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nunca (aporte insuficiente)</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Asset designation */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-primary" /> Ativos vinculados a este sonho
        </h2>
        {available.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhum ativo disponível. Cadastre ativos no módulo de Investimentos.</p>
        ) : (
          <div className="space-y-2">
            {available.map((a) => {
              const isDesignated = a.dreamId === id
              return (
                <div
                  key={a.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-3 py-2 transition-colors',
                    isDesignated ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'
                  )}
                >
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.type} · {formatCurrency(a.currentValue)}</p>
                  </div>
                  <button
                    onClick={() => toggleAsset(a)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      isDesignated
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {isDesignated ? <><Link2Off className="h-3 w-3" /> Desvincular</> : <><Link2 className="h-3 w-3" /> Vincular</>}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
