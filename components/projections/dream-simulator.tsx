'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Dream {
  id: string
  name: string
  targetAmount: number
  targetDate: string | null
}

type Scenario = 'conservative' | 'current' | 'accelerated'

interface SimResult {
  scenario: Scenario
  monthsToGoal: number
  estimatedDate: string
  rateUsed: number
  pastTargetDate: boolean
}

interface SimulationData {
  dream: {
    id: string
    name: string
    targetAmount: number
    targetDate: string | null
    currentProgress: number
  }
  results: SimResult[]
}

const SCENARIO_CFG: Record<Scenario, { label: string; icon: string; cls: string }> = {
  conservative: { label: 'Conservador', icon: '🐢', cls: 'border-blue-400/40 bg-blue-50/50 dark:bg-blue-900/10' },
  current:      { label: 'Atual',       icon: '📈', cls: 'border-primary/30 bg-primary/5' },
  accelerated:  { label: 'Acelerado',   icon: '🚀', cls: 'border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-900/10' },
}

function formatMonths(n: number): string {
  if (n >= 600) return '50+ anos'
  const years = Math.floor(n / 12)
  const months = n % 12
  if (years === 0) return `${months} meses`
  if (months === 0) return `${years} ano${years > 1 ? 's' : ''}`
  return `${years}a ${months}m`
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

interface Props {
  dreams: Dream[]
}

export function DreamSimulator({ dreams }: Props) {
  const [selectedDreamId, setSelectedDreamId] = useState<string>(dreams[0]?.id ?? '')
  const [contribution, setContribution] = useState(500)
  const [data, setData] = useState<SimulationData | null>(null)
  const [loading, setLoading] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchSim = useCallback(
    debounce(async (dreamId: string, c: number) => {
      if (!dreamId) return
      setLoading(true)
      try {
        const res = await fetch(`/api/projections/simulate-dream?dreamId=${dreamId}&contribution=${c}`)
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
      }
    }, 200),
    []
  )

  useEffect(() => {
    if (selectedDreamId) fetchSim(selectedDreamId, contribution)
  }, [selectedDreamId, contribution, fetchSim])

  if (dreams.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center text-sm text-muted-foreground">
        Nenhum sonho cadastrado. <Link href="/dreams" className="underline text-primary">Cadastrar sonho →</Link>
      </div>
    )
  }

  const gap = data ? data.dream.targetAmount - data.dream.currentProgress : 0

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <h2 className="text-sm font-semibold">Simulador de Sonhos</h2>

      {/* Dream selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sonho</label>
          <Select value={selectedDreamId} onValueChange={(v) => { if (v) setSelectedDreamId(v) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dreams.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name} — {formatCurrency(d.targetAmount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Aporte mensal dedicado: <span className="text-foreground font-semibold">{formatCurrency(contribution)}</span>
          </label>
          <input
            type="range"
            min={100}
            max={10000}
            step={100}
            value={contribution}
            onChange={(e) => setContribution(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>R$100</span>
            <span>R$10.000</span>
          </div>
        </div>
      </div>

      {/* Progress info */}
      {data && (
        <p className="text-xs text-muted-foreground">
          Progresso atual: <strong>{formatCurrency(data.dream.currentProgress)}</strong> de{' '}
          <strong>{formatCurrency(data.dream.targetAmount)}</strong> — Faltam{' '}
          <strong>{formatCurrency(Math.max(0, gap))}</strong>
        </p>
      )}

      {/* 3 Scenario cards */}
      <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3 transition-opacity', loading && 'opacity-50')}>
        {(data?.results ?? []).map((r) => {
          const cfg = SCENARIO_CFG[r.scenario]
          const date = new Date(r.estimatedDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          return (
            <div key={r.scenario} className={cn('rounded-xl border p-4 space-y-2', cfg.cls)}>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {r.pastTargetDate && (
                  <span className="ml-auto text-[10px] font-bold text-destructive bg-destructive/10 rounded px-1.5 py-0.5">
                    Prazo ultrapassado
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold font-mono">{formatMonths(r.monthsToGoal)}</p>
              <p className="text-xs text-muted-foreground">
                Previsão: <strong>{date}</strong>
              </p>
              <p className="text-[10px] text-muted-foreground">
                Taxa: {(r.rateUsed * 100).toFixed(1)}% a.a.
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
