import { assetColor, assetLabel } from '@/lib/investments/constants'
import { formatCurrency, formatPct } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface AllocationRow {
  assetType: string
  currentValue: number
  currentPct: number
  targetPct: number
}

interface AllocationTableProps {
  rows: AllocationRow[]
  className?: string
}

function DeltaCell({ delta }: { delta: number }) {
  const abs = Math.abs(delta)
  const sign = delta >= 0 ? '+' : ''
  const color =
    abs <= 5
      ? 'text-income'
      : abs <= 15
      ? 'text-warning'
      : 'text-expense'

  return (
    <td className={cn('px-3 py-2.5 text-right font-mono text-xs font-medium', color)}>
      {sign}{formatPct(delta)}
    </td>
  )
}

export function AllocationTable({ rows, className }: AllocationTableProps) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tipo de ativo
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Valor
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Atual
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Target
            </th>
            <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Delta
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const delta = row.currentPct - row.targetPct
            return (
              <tr key={row.assetType} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: assetColor(row.assetType) }}
                    />
                    <span className="text-foreground text-sm font-medium">
                      {assetLabel(row.assetType)}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground font-mono text-xs tabular-nums">
                  {formatCurrency(row.currentValue)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-foreground">
                  {formatPct(row.currentPct)}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {formatPct(row.targetPct)}
                </td>
                <DeltaCell delta={delta} />
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
