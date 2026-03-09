'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatPct } from '@/lib/utils'
import { assetColor, assetLabel } from '@/lib/investments/constants'
import { cn } from '@/lib/utils'

export interface AllocationSlice {
  assetType: string
  value: number
  pct: number
}

interface AllocationDonutProps {
  data: AllocationSlice[]
  totalValue?: number
  className?: string
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationSlice }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs space-y-0.5">
      <p className="font-semibold text-foreground">{assetLabel(d.assetType)}</p>
      <p className="text-muted-foreground">{formatCurrency(d.value)}</p>
      <p className="font-medium text-foreground">{formatPct(d.pct)}</p>
    </div>
  )
}

function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          {assetLabel(entry.value)}
        </li>
      ))}
    </ul>
  )
}

export function AllocationDonut({ data, totalValue, className }: AllocationDonutProps) {
  if (!data.length) {
    return (
      <div className={cn('flex items-center justify-center h-56 text-sm text-muted-foreground', className)}>
        Sem dados de alocação
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="pct"
            nameKey="assetType"
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((slice) => (
              <Cell key={slice.assetType} fill={assetColor(slice.assetType)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={<CustomLegend />}
            payload={data.map((s) => ({ value: s.assetType, color: assetColor(s.assetType) }))}
          />
        </PieChart>
      </ResponsiveContainer>

      {totalValue !== undefined && (
        <p className="text-center text-xs text-muted-foreground mt-1">
          Total:{' '}
          <span className="font-semibold text-foreground font-mono">
            {formatCurrency(totalValue)}
          </span>
        </p>
      )}
    </div>
  )
}
