'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/progress-bar'
import type { ReserveStatus } from '@/lib/reserve/calculator'

type Props = {
  currentValue: number
  targetValue: number
  coverageMonths: number
  targetMonths: number
  status: ReserveStatus
  monthlyContributionNeeded: number
}

const STATUS_CONFIG: Record<ReserveStatus, { icon: string; label: string; className: string; barClass: string }> = {
  critical: {
    icon: '🔴',
    label: 'Crítica',
    className: 'border-destructive/40 bg-destructive/5',
    barClass: 'bg-destructive',
  },
  warning: {
    icon: '🟡',
    label: 'Incompleta',
    className: 'border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10',
    barClass: 'bg-amber-500',
  },
  ok: {
    icon: '🟢',
    label: 'Atingida',
    className: 'border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-900/10',
    barClass: 'bg-emerald-500',
  },
  complete: {
    icon: '🏆',
    label: 'Completa',
    className: 'border-emerald-400/40 bg-emerald-50/50 dark:bg-emerald-900/10',
    barClass: 'bg-emerald-500',
  },
}

export function ReserveProgress({
  currentValue,
  targetValue,
  coverageMonths,
  targetMonths,
  status,
  monthlyContributionNeeded,
}: Props) {
  const cfg = STATUS_CONFIG[status]
  const pct = targetValue > 0 ? Math.min(100, (currentValue / targetValue) * 100) : 0
  const monthsGap = Math.max(0, targetMonths - coverageMonths)

  return (
    <div className={cn('rounded-xl border p-5 space-y-4', cfg.className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{cfg.icon}</span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Reserva de Emergência</h2>
            <p className="text-xs text-muted-foreground">{cfg.label}</p>
          </div>
        </div>
        <span className="text-2xl font-bold font-mono text-foreground">{pct.toFixed(1)}%</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{formatCurrency(currentValue)}</span>
          <span>Meta: {formatCurrency(targetValue)}</span>
        </div>
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', cfg.barClass)}
            style={{ width: `${pct.toFixed(1)}%` }}
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Cobertura atual</p>
          <p className="text-lg font-bold">{coverageMonths.toFixed(1)}<span className="text-xs font-normal text-muted-foreground"> meses</span></p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Meta</p>
          <p className="text-lg font-bold">{targetMonths}<span className="text-xs font-normal text-muted-foreground"> meses</span></p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Faltam</p>
          <p className="text-lg font-bold">{monthsGap.toFixed(1)}<span className="text-xs font-normal text-muted-foreground"> meses</span></p>
        </div>
        <div className="rounded-lg bg-background/60 p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Falta (R$)</p>
          <p className="text-sm font-bold">{formatCurrency(Math.max(0, targetValue - currentValue))}</p>
        </div>
      </div>

      {/* Suggestion */}
      {monthlyContributionNeeded > 0 && status !== 'ok' && status !== 'complete' && (
        <p className={cn(
          'text-xs font-medium px-3 py-2 rounded-lg',
          status === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
        )}>
          💡 Aporte <strong>{formatCurrency(monthlyContributionNeeded)}/mês</strong> para atingir a meta em 6 meses
        </p>
      )}
    </div>
  )
}
