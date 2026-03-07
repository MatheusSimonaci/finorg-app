import { cn } from '@/lib/utils'

type ProgressVariant =
  | 'default'
  | 'income'
  | 'expense'
  | 'investment'
  | 'reserve'
  | 'warning'
  | 'danger'

interface ProgressBarProps {
  /** 0–100+ (over 100 triggers danger styling) */
  value: number
  label?: string
  sublabel?: string
  showPercent?: boolean
  variant?: ProgressVariant
  size?: 'sm' | 'md'
  className?: string
}

const trackFill: Record<ProgressVariant, string> = {
  default: 'bg-primary',
  income: 'bg-income',
  expense: 'bg-expense',
  investment: 'bg-investment',
  reserve: 'bg-reserve',
  warning: 'bg-warning',
  danger: 'bg-expense',
}

export function ProgressBar({
  value,
  label,
  sublabel,
  showPercent = false,
  variant = 'default',
  size = 'md',
  className,
}: ProgressBarProps) {
  const capped = Math.min(100, Math.max(0, value))
  const isOver = value > 100

  return (
    <div className={cn('space-y-1.5', className)}>
      {(label || showPercent || sublabel) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && (
            <span className="text-muted-foreground font-medium truncate">{label}</span>
          )}
          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
            {sublabel && <span className="text-muted-foreground">{sublabel}</span>}
            {showPercent && (
              <span
                className={cn(
                  'font-semibold tabular-nums',
                  isOver ? 'text-expense' : 'text-foreground',
                )}
              >
                {value.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-muted rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            isOver ? 'bg-expense' : trackFill[variant],
          )}
          style={{ width: `${capped}%` }}
        />
      </div>
    </div>
  )
}
