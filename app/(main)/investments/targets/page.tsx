'use client'

import { useState, useEffect, useCallback } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ASSET_TYPE_LIST, ASSET_TYPES, MODERATE_TEMPLATE, assetColor } from '@/lib/investments/constants'
import type { AssetType } from '@/lib/investments/constants'
import { cn } from '@/lib/utils'

type AllocationMode = 'normal' | 'sonho_ativo' | 'rebalanceando'

type Targets = Record<AssetType, number>

const DEFAULT_TARGETS: Record<AllocationMode, Targets> = {
  normal: { ...MODERATE_TEMPLATE },
  sonho_ativo: {
    ...MODERATE_TEMPLATE,
    conta_remunerada: 20,
    tesouro: 25,
    cdb: 15,
    lci_lca: 10,
    fii: 10,
    acoes: 10,
    cripto: 3,
    previdencia: 5,
    fundo: 2,
  },
  rebalanceando: { ...MODERATE_TEMPLATE },
}

function normalizeTargets(targets: Targets): Targets {
  const total = Object.values(targets).reduce((s, v) => s + v, 0)
  if (total === 0) return targets
  return Object.fromEntries(
    Object.entries(targets).map(([k, v]) => [k, parseFloat(((v / total) * 100).toFixed(1))]),
  ) as Targets
}

function TargetSliders({
  targets,
  onChange,
}: {
  targets: Targets
  onChange: (targets: Targets) => void
}) {
  const total = Object.values(targets).reduce((s, v) => s + v, 0)
  const isValid = Math.abs(total - 100) < 0.5

  return (
    <div className="space-y-4">
      {ASSET_TYPE_LIST.map((type) => (
        <div key={type} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: assetColor(type) }}
              />
              <span className="text-sm font-medium text-foreground">
                {ASSET_TYPES[type].label}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={targets[type]}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                  onChange({ ...targets, [type]: v })
                }}
                className="w-16 text-right text-sm font-mono tabular-nums bg-input border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-xs text-muted-foreground w-4">%</span>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={targets[type]}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              onChange({ ...targets, [type]: v })
            }}
            className="w-full accent-primary cursor-pointer h-1.5 rounded-full"
            style={{
              background: `linear-gradient(to right, ${assetColor(type)} 0%, ${assetColor(type)} ${targets[type]}%, var(--color-muted) ${targets[type]}%, var(--color-muted) 100%)`,
            }}
          />
        </div>
      ))}

      {/* Total bar */}
      <div className="rounded-lg border border-border p-3 space-y-1.5 mt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Total alocado</span>
          <span
            className={cn(
              'font-bold font-mono tabular-nums',
              isValid ? 'text-income' : total > 100 ? 'text-expense' : 'text-warning',
            )}
          >
            {total.toFixed(1)}%
          </span>
        </div>
        <ProgressBar
          value={total}
          variant={isValid ? 'income' : total > 100 ? 'danger' : 'warning'}
        />
        {!isValid && (
          <p className="text-xs text-expense">
            {total > 100
              ? `${(total - 100).toFixed(1)}% acima de 100% — ajuste os valores`
              : `Faltam ${(100 - total).toFixed(1)}% para fechar em 100%`}
          </p>
        )}
      </div>
    </div>
  )
}

export default function TargetsPage() {
  const [targets, setTargets] = useState<Record<AllocationMode, Targets>>({ ...DEFAULT_TARGETS })
  const [saving, setSaving] = useState<AllocationMode | null>(null)
  const [saved, setSaved] = useState<AllocationMode | null>(null)

  const loadMode = useCallback(async (mode: AllocationMode) => {
    const res = await fetch(`/api/allocation-targets?mode=${mode}`)
    const data = await res.json()
    setTargets((t) => ({ ...t, [mode]: data as Targets }))
  }, [])

  useEffect(() => {
    loadMode('normal')
    loadMode('sonho_ativo')
    loadMode('rebalanceando')
  }, [loadMode])

  async function handleSave(mode: AllocationMode) {
    setSaving(mode)
    try {
      await fetch(`/api/allocation-targets?mode=${mode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targets[mode]),
      })
      setSaved(mode)
      setTimeout(() => setSaved(null), 2000)
    } finally {
      setSaving(null)
    }
  }

  function handleReset(mode: AllocationMode) {
    setTargets((t) => ({ ...t, [mode]: { ...MODERATE_TEMPLATE } }))
  }

  function handleApplyModerate(mode: AllocationMode) {
    setTargets((t) => ({ ...t, [mode]: { ...MODERATE_TEMPLATE } }))
  }

  const modes: Array<{ key: AllocationMode; label: string; description: string }> = [
    { key: 'normal', label: 'Normal', description: 'Alocação padrão para o dia a dia' },
    { key: 'sonho_ativo', label: 'Sonho Ativo', description: 'Mais liquidez enquanto acumula para um sonho' },
    { key: 'rebalanceando', label: 'Rebalanceando', description: 'Meta de rebalanceamento gradual pós-saque' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Alocação-Alvo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure o percentual ideal por tipo de ativo em cada modo
          </p>
        </div>
        <a href="/investments" className="text-xs text-primary hover:underline self-start pt-1">
          ← Voltar ao portfólio
        </a>
      </div>

      {/* Apply moderado template */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Template perfil moderado</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribuição equilibrada entre renda fixa, FIIs e variável
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setTargets({
              normal: { ...MODERATE_TEMPLATE },
              sonho_ativo: { ...DEFAULT_TARGETS.sonho_ativo },
              rebalanceando: { ...MODERATE_TEMPLATE },
            })
          }
        >
          Aplicar template
        </Button>
      </div>

      {/* Mode tabs */}
      <Tabs defaultValue="normal">
        <TabsList className="w-full sm:w-auto">
          {modes.map((m) => (
            <TabsTrigger key={m.key} value={m.key} className="flex-1 sm:flex-none">
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {modes.map((m) => (
          <TabsContent key={m.key} value={m.key} className="mt-4">
            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs text-muted-foreground">{m.description}</p>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReset(m.key)}
                  >
                    <RotateCcw className="h-3 w-3 mr-1.5" />
                    Resetar
                  </Button>
                  <Button size="sm" onClick={() => handleSave(m.key)} disabled={saving === m.key}>
                    <Save className="h-3 w-3 mr-1.5" />
                    {saving === m.key ? 'Salvando…' : saved === m.key ? 'Salvo!' : 'Salvar'}
                  </Button>
                </div>
              </div>

              <TargetSliders
                targets={targets[m.key]}
                onChange={(t) => setTargets((prev) => ({ ...prev, [m.key]: t }))}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
