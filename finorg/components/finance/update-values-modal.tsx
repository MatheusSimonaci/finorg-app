'use client'

import { useState } from 'react'
import { RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, formatDate } from '@/lib/utils'
import { assetLabel } from '@/lib/investments/constants'
import { cn } from '@/lib/utils'

export interface AssetToUpdate {
  id: string
  name: string
  type: string
  institution: string
  currentValue: number
  lastUpdated: string
  staleDays: number
}

interface UpdateValuesModalProps {
  assets: AssetToUpdate[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: Array<{ id: string; value: number }>) => Promise<void>
}

function diffLabel(original: number, current: number) {
  if (!current || isNaN(current) || current === original) return null
  const diff = current - original
  const pct = (diff / original) * 100
  const isUp = diff > 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums',
        isUp ? 'text-income' : 'text-expense',
      )}
    >
      {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {isUp ? '+' : ''}{formatCurrency(diff)} ({isUp ? '+' : ''}{pct.toFixed(1)}%)
    </span>
  )
}

export function UpdateValuesModal({
  assets,
  open,
  onOpenChange,
  onSave,
}: UpdateValuesModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(assets.map((a) => [a.id, String(a.currentValue)])),
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = assets.map((a) => ({
        id: a.id,
        value: parseFloat(values[a.id]) || a.currentValue,
      }))
      await onSave(updates)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Atualizar valores dos ativos
          </DialogTitle>
          <DialogDescription>
            Informe o valor atual de cada ativo. Um snapshot será salvo automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {assets.map((asset) => {
            const currentNum = parseFloat(values[asset.id]) || asset.currentValue
            const isStale = asset.staleDays > 30
            return (
              <div
                key={asset.id}
                className={cn(
                  'rounded-lg border p-3 space-y-2',
                  isStale ? 'border-warning/40 bg-warning/5' : 'border-border bg-muted/20',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {asset.name}
                      </span>
                      {isStale && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Desatualizado ({asset.staleDays}d)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {assetLabel(asset.type)} · {asset.institution}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Última atualização: {formatDate(asset.lastUpdated)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Antes: <span className="font-mono">{formatCurrency(asset.currentValue)}</span>
                    </p>
                    {diffLabel(asset.currentValue, currentNum)}
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={values[asset.id]}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [asset.id]: e.target.value }))
                    }
                    className="pl-8 font-mono text-sm tabular-nums"
                    placeholder={String(asset.currentValue)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" />
            ) : null}
            Salvar e criar snapshot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
