'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants'

interface BudgetHistoryChartProps {
  data: Record<string, number | string>[]
  categories: string[]
}

export function BudgetHistoryChart({ data, categories }: BudgetHistoryChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum histórico disponível
      </div>
    )
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              CATEGORY_LABELS[name] || name,
            ]}
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            formatter={(name: string) => CATEGORY_LABELS[name] || name}
            wrapperStyle={{ fontSize: '11px' }}
          />
          {categories.map((cat) => (
            <Bar key={cat} dataKey={cat} stackId="a" fill={CATEGORY_COLORS[cat] || '#94a3b8'} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
