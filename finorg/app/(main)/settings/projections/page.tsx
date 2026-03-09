'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'

interface ParamRow {
  id: string
  assetCategory: string
  annualRate: number
  irRate: number
}

interface GlobalP {
  id: string
  inflationRate: number
}

const CATEGORY_LABELS: Record<string, string> = {
  tesouro: 'Tesouro Direto',
  cdb: 'CDB',
  lci_lca: 'LCI / LCA',
  fii: 'FII',
  acoes: 'Ações',
  cripto: 'Cripto',
  previdencia: 'Previdência',
  fundo: 'Fundo',
  conta_remunerada: 'Conta Remunerada',
}

export default function ProjectionSettingsPage() {
  const [params, setParams] = useState<ParamRow[]>([])
  const [globalP, setGlobalP] = useState<GlobalP | null>(null)
  const [inflationRate, setInflationRate] = useState(4.5)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch('/api/settings/projection-params')
    if (res.ok) {
      const data = await res.json()
      setParams(data.params)
      setGlobalP(data.global)
      setInflationRate((data.global?.inflationRate ?? 0.045) * 100)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function updateRate(assetCategory: string, field: 'annualRate' | 'irRate', value: number) {
    setParams((prev) =>
      prev.map((p) => (p.assetCategory === assetCategory ? { ...p, [field]: value / 100 } : p))
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/projection-params', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params, inflationRate: inflationRate / 100 }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleReset() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/projection-params', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setParams(data.params)
        setGlobalP(data.global)
        setInflationRate((data.global?.inflationRate ?? 0.045) * 100)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 max-w-2xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-80 bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/projections">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Parâmetros de Projeção</h1>
      </div>

      {/* Global Params */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Global</h2>
        <div className="flex items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium">Inflação anual projetada (%)</label>
            <Input
              type="number"
              step="0.1"
              min={0}
              max={50}
              value={inflationRate}
              onChange={(e) => setInflationRate(Number(e.target.value))}
              className="font-mono max-w-[140px]"
            />
          </div>
          <p className="text-xs text-muted-foreground pt-5">
            Exemplo: <strong>4,5%</strong> = IPCA histórico médio
          </p>
        </div>
      </div>

      {/* Asset rates table */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/20">
          <h2 className="text-sm font-semibold">Taxas por categoria de ativo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Valores em % ao ano</p>
        </div>
        <div className="divide-y">
          {params.map((p) => (
            <div key={p.assetCategory} className="grid grid-cols-3 items-center gap-4 px-4 py-3">
              <p className="text-sm font-medium">{CATEGORY_LABELS[p.assetCategory] ?? p.assetCategory}</p>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Rentabilidade a.a. (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={(p.annualRate * 100).toFixed(1)}
                  onChange={(e) => updateRate(p.assetCategory, 'annualRate', Number(e.target.value))}
                  className="font-mono text-sm h-8"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground">Alíquota IR (%)</label>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  max={30}
                  value={(p.irRate * 100).toFixed(1)}
                  onChange={(e) => updateRate(p.assetCategory, 'irRate', Number(e.target.value))}
                  className="font-mono text-sm h-8"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
          <Save className="h-4 w-4" />
          {saved ? '✓ Salvo!' : saving ? 'Salvando…' : 'Salvar parâmetros'}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={saving}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Restaurar padrões
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        As projeções usam estes parâmetros em todos os cálculos de patrimônio e simulação de sonhos.
      </p>
    </div>
  )
}
