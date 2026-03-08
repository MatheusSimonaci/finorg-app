'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'

type Config = {
  id: string
  targetMonths: number
  calculationWindowMonths: number
  excludeOutliers: boolean
  monthlyAvg: number
  targetValue: number
}

export default function ReserveSettingsPage() {
  const [config, setConfig] = useState<Config | null>(null)
  const [targetMonths, setTargetMonths] = useState(4)
  const [windowMonths, setWindowMonths] = useState(3)
  const [excludeOutliers, setExcludeOutliers] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Computed preview (live)
  const previewTarget = (config?.monthlyAvg ?? 0) * targetMonths

  useEffect(() => {
    fetch('/api/reserve/config')
      .then((r) => r.json())
      .then((d: Config) => {
        setConfig(d)
        setTargetMonths(d.targetMonths)
        setWindowMonths(d.calculationWindowMonths)
        setExcludeOutliers(d.excludeOutliers)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/reserve/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetMonths, calculationWindowMonths: windowMonths, excludeOutliers }),
      })
      if (res.ok) {
        const updated: Config = await res.json()
        setConfig(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 animate-pulse max-w-xl mx-auto">
        <div className="h-8 bg-muted rounded w-40" />
        <div className="h-60 bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/reserve">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Configurar Reserva</h1>
      </div>

      {/* Form card */}
      <div className="rounded-xl border bg-card p-5 space-y-5">
        {/* Target months */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Meses de despesas para a meta
          </label>
          <Input
            type="number"
            min={1}
            max={24}
            value={targetMonths}
            onChange={(e) => setTargetMonths(Number(e.target.value) || 1)}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Recomendado: 3–6 meses. Autônomos: 6–12 meses.
          </p>
        </div>

        {/* Calculation window */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Janela de cálculo da média
          </label>
          <Select
            value={String(windowMonths)}
            onValueChange={(v) => setWindowMonths(Number(v))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Último mês</SelectItem>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Período usado para calcular o gasto médio mensal.
          </p>
        </div>

        {/* Exclude outliers */}
        <div className="flex items-center justify-between py-2 border-t">
          <div>
            <p className="text-sm font-medium">Excluir meses atípicos</p>
            <p className="text-xs text-muted-foreground">Ignora meses com gastos muito acima da média (×2).</p>
          </div>
          <button
            onClick={() => setExcludeOutliers((v) => !v)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              excludeOutliers ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                excludeOutliers ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Live preview */}
      {config && config.monthlyAvg > 0 && (
        <div className="rounded-xl border bg-muted/20 p-4 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Prévia</p>
          <p className="text-sm">
            Gasto médio: <strong className="font-mono">{formatCurrency(config.monthlyAvg)}/mês</strong>
          </p>
          <p className="text-sm">
            Meta calculada: <strong className="font-mono text-primary">{formatCurrency(previewTarget)}</strong>{' '}
            <span className="text-muted-foreground text-xs">({targetMonths} × {formatCurrency(config.monthlyAvg)})</span>
          </p>
        </div>
      )}

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        <Save className="h-4 w-4" />
        {saved ? '✓ Salvo!' : saving ? 'Salvando…' : 'Salvar configuração'}
      </Button>
    </div>
  )
}
