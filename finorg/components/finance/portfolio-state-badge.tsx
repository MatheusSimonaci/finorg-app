import { cn } from '@/lib/utils'
import type { PortfolioState } from '@/lib/investments/constants'

interface PortfolioStateBadgeProps {
  state: PortfolioState
  rebalanceProgress?: number  // 0–100, only shown when REBALANCEANDO
  className?: string
}

const STATE_CONFIG: Record<
  PortfolioState,
  { dot: string; text: string; bg: string; label: string; description: string }
> = {
  EQUILIBRADA: {
    dot: 'bg-income',
    text: 'text-income',
    bg: 'bg-income/10 border-income/20',
    label: 'EQUILIBRADA',
    description: 'Carteira dentro dos targets',
  },
  SOB_SONHO: {
    dot: 'bg-reserve animate-pulse',
    text: 'text-reserve',
    bg: 'bg-reserve/10 border-reserve/20',
    label: 'SOB SONHO',
    description: 'Alocação ajustada para sonho ativo',
  },
  REBALANCEANDO: {
    dot: 'bg-warning animate-pulse',
    text: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
    label: 'REBALANCEANDO',
    description: 'Retornando ao target gradualmente',
  },
}

export function PortfolioStateBadge({
  state,
  rebalanceProgress,
  className,
}: PortfolioStateBadgeProps) {
  const cfg = STATE_CONFIG[state]

  return (
    <div
      className={cn(
        'inline-flex flex-col gap-1.5 rounded-lg border px-3 py-2',
        cfg.bg,
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
        <span className={cn('text-xs font-bold tracking-widest', cfg.text)}>
          {cfg.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground pl-4">{cfg.description}</p>

      {state === 'REBALANCEANDO' && rebalanceProgress !== undefined && (
        <div className="pl-4 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Progresso para o target</span>
            <span className="font-semibold text-warning">
              {rebalanceProgress.toFixed(0)}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-warning/20">
            <div
              className="h-full rounded-full bg-warning transition-all duration-500"
              style={{ width: `${Math.min(100, rebalanceProgress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
