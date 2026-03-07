import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; href: string }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-border bg-muted/20',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 p-4 rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
