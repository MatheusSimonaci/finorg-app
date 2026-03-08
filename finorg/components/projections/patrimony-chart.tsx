'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

export type DisplayMode = 'nominal' | 'real'

interface DataPoint {
  label: string
  nominalWith: number
  nominalWithout: number
  realWith: number
  realWithout: number
}

interface DreamMarker {
  name: string
  year: number
  targetAmount: number
}

interface Props {
  data: DataPoint[]
  dreamMarkers: DreamMarker[]
  displayMode: DisplayMode
}

function shortCurrency(value: number): string {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(0)}k`
  return formatCurrency(value)
}

export function PatrimonyChart({ data, dreamMarkers, displayMode }: Props) {
  const withKey = displayMode === 'nominal' ? 'nominalWith' : 'realWith'
  const withoutKey = displayMode === 'nominal' ? 'nominalWithout' : 'realWithout'

  // Collect dream year labels (one per year, take first marker)
  const markerYears = new Map<string, DreamMarker>()
  for (const dm of dreamMarkers) {
    const key = String(dm.year)
    if (!markerYears.has(key)) markerYears.set(key, dm)
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={shortCurrency}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={72}
        />
        <Tooltip
          formatter={(v) => formatCurrency(Number(v))}
          labelStyle={{ fontWeight: 600 }}
          contentStyle={{
            borderRadius: '8px',
            border: '1px solid hsl(var(--border))',
            background: 'hsl(var(--card))',
            color: 'hsl(var(--foreground))',
          }}
        />
        <Legend
          formatter={(v) => (v === withKey ? 'Com aportes' : 'Sem aportes')}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />

        {/* Dream markers */}
        {[...markerYears.entries()].map(([year, dm]) => (
          <ReferenceLine
            key={year}
            x={year}
            stroke="#fbbf24"
            strokeDasharray="4 2"
            label={{
              value: dm.name,
              position: 'insideTopRight',
              fontSize: 10,
              fill: '#d97706',
            }}
          />
        ))}

        <Line
          type="monotone"
          dataKey={withKey}
          name={withKey}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey={withoutKey}
          name={withoutKey}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
