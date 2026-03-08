'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { assetColor, assetLabel } from '@/lib/investments/constants'
import { cn } from '@/lib/utils'

export interface ContributionsDataPoint {
  month: string
  [assetType: string]: number | string
}

interface ContributionsChartProps {
  data: ContributionsDataPoint[]
  assetTypes: string[]
  className?: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value || 0), 0)
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-md text-xs space-y-1.5 min-w-[160px]">
      <p className="font-semibold text-foreground border-b border-border pb-1">{label}</p>
      {payload.filter((p) => p.value > 0).map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.fill }} />
            <span className="text-muted-foreground">{assetLabel(p.name)}</span>
          </div>
          <span className="font-mono text-foreground">{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="flex justify-between border-t border-border pt-1 font-semibold">
        <span className="text-muted-foreground">Total</span>
        <span className="font-mono text-foreground">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

export function ContributionsChart({ data, assetTypes, className }: ContributionsChartProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-sm text-muted-foreground', className)}>
        Sem histórico de aportes
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => `R$${(v / 1_000).toFixed(0)}k`}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span style={{ color: 'var(--color-muted-foreground)', fontSize: 11 }}>
                {assetLabel(value)}
              </span>
            )}
          />
          {assetTypes.map((type) => (
            <Bar key={type} dataKey={type} stackId="a" fill={assetColor(type)} radius={type === assetTypes.at(-1) ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
