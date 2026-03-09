'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface NetWorthDataPoint {
  month: string   // e.g. "Jan/26"
  value: number
}

interface NetWorthChartProps {
  data: NetWorthDataPoint[]
  className?: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground font-mono">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function NetWorthChart({ data, className }: NetWorthChartProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-48 text-sm text-muted-foreground', className)}>
        Sem histórico de patrimônio
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-investment)" />
              <stop offset="100%" stopColor="var(--color-income)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) =>
              v >= 1_000_000
                ? `R$${(v / 1_000_000).toFixed(1)}M`
                : `R$${(v / 1_000).toFixed(0)}k`
            }
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            width={58}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#nwGrad)"
            strokeWidth={2.5}
            dot={{ fill: 'var(--color-investment)', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: 'var(--color-investment)', strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
