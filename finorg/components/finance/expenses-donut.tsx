'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/lib/constants'

type DonutEntry = {
  category: string
  amount: number
  pct: number
}

interface ExpensesDonutProps {
  data: DonutEntry[]
  totalExpenses: number
}

export function ExpensesDonut({ data }: ExpensesDonutProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        Nenhum gasto registrado
      </div>
    )
  }

  const chartData = data.map((d) => ({
    name: CATEGORY_LABELS[d.category] || d.category,
    value: d.amount,
    pct: d.pct,
    category: d.category,
  }))

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.category}
                fill={CATEGORY_COLORS[entry.category] || '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => [
              value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
              'Gasto',
            ]}
          />
          <Legend
            formatter={(value, entry) => {
              const pct = (entry?.payload as Record<string, unknown>)?.pct
              return `${value} (${typeof pct === 'number' ? pct.toFixed(0) : 0}%)`
            }}
            wrapperStyle={{ fontSize: '11px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
