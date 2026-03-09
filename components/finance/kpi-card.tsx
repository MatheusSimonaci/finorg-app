import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type KpiVariant = 'default' | 'income' | 'expense' | 'investment' | 'reserve'

export interface KpiCardProps {
  label: string
  value: string
  subtext?: string
  icon?: React.ReactNode
  trend?: { direction: 'up' | 'down'; label: string }
  variant?: KpiVariant
}

const variantStyles: Record<
  KpiVariant,
  { icon: string; value: string; trend: string; valueGlow: string }
> = {
  default: {
    icon: 'bg-muted text-muted-foreground',
    value: 'text-foreground',
    trend: 'bg-muted text-muted-foreground',
    valueGlow: '',
  },
  income: {
    icon: 'bg-income/10 text-income',
    value: 'text-income',
    trend: 'bg-income/10 text-income',
    valueGlow: 'income-glow',
  },
  expense: {
    icon: 'bg-expense/10 text-expense',
    value: 'text-expense',
    trend: 'bg-expense/10 text-expense',
    valueGlow: 'expense-glow',
  },
  investment: {
    icon: 'bg-investment/10 text-investment',
    value: 'text-investment',
    trend: 'bg-investment/10 text-investment',
    valueGlow: 'invest-glow',
  },
  reserve: {
    icon: 'bg-reserve/10 text-reserve',
    value: 'text-reserve',
    trend: 'bg-reserve/10 text-reserve',
    valueGlow: 'reserve-glow',
  },
}

export function KpiCard({
  label,
  value,
  subtext,
  icon,
  trend,
  variant = 'default',
}: KpiCardProps) {
  const s = variantStyles[variant]

  return (
    <div className="relative rounded border border-border bg-card p-5 flex flex-col gap-3">
      {/* Holographic corner brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-[1.5px] border-l-[1.5px] border-holo/45 hidden dark:block" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-[1.5px] border-r-[1.5px] border-holo/45 hidden dark:block" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1.5px] border-l-[1.5px] border-holo/45 hidden dark:block" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1.5px] border-r-[1.5px] border-holo/45 hidden dark:block" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider leading-none">
          {label}
        </span>
        {icon && (
          <div className={cn('p-1.5 rounded flex-shrink-0', s.icon)}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            'text-2xl font-bold font-mono tabular-nums leading-none',
            s.value,
            s.valueGlow,
          )}
        >
          {value}
        </span>
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded font-medium flex-shrink-0',
              s.trend,
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {trend.label}
          </div>
        )}
      </div>

      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </div>
  )
}
