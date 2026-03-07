import { cn } from '@/lib/utils'

type CategoryVariant =
  | 'default'
  | 'income'
  | 'expense'
  | 'investment'
  | 'reserve'
  | 'warning'
  | 'muted'
  | 'outline'

interface CategoryBadgeProps {
  variant?: CategoryVariant
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<CategoryVariant, string> = {
  default: 'bg-primary/10 text-primary',
  income: 'bg-income/10 text-income',
  expense: 'bg-expense/10 text-expense',
  investment: 'bg-investment/10 text-investment',
  reserve: 'bg-reserve/10 text-reserve',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-muted text-muted-foreground',
  outline: 'border border-border text-muted-foreground',
}

const sizeClasses: Record<'sm' | 'md', string> = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-0.5 text-xs',
}

export function CategoryBadge({
  variant = 'default',
  size = 'md',
  children,
  className,
}: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
