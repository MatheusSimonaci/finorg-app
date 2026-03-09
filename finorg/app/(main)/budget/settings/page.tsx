'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, RotateCcw } from 'lucide-react'
import { BUDGET_CATEGORIES, CATEGORY_LABELS, TEMPLATE_50_30_20 } from '@/lib/constants'

type RuleForm = {
  category: string
  targetPct: number
  alertThresholdPct: number
}

const DEFAULT_RULES: RuleForm[] = BUDGET_CATEGORIES.map((cat) => ({
  category: cat,
  targetPct: 0,
  alertThresholdPct: 80,
}))

export default function BudgetSettingsPage() {
  const [rules, setRules] = useState<RuleForm[]>(DEFAULT_RULES)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/budget/rules')
      .then((r) => r.json())
      .then((data: RuleForm[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const merged = DEFAULT_RULES.map((def) => {
            const existing = data.find((r) => r.category === def.category)
            return existing
              ? { ...def, targetPct: existing.targetPct, alertThresholdPct: existing.alertThresholdPct }
              : def
          })
          setRules(merged)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalPct = rules.reduce((s, r) => s + (r.targetPct || 0), 0)
  const isOverLimit = totalPct > 100

  const update = (category: string, field: keyof RuleForm, value: number) => {
    setSaved(false)
    setRules((prev) => prev.map((r) => (r.category === category ? { ...r, [field]: value } : r)))
  }

  const applyTemplate = () => {
    setSaved(false)
    setRules(
      DEFAULT_RULES.map((def) => {
        const tmpl = TEMPLATE_50_30_20.find((t) => t.category === def.category)
        return tmpl ? { ...def, targetPct: tmpl.targetPct, alertThresholdPct: tmpl.alertThresholdPct } : def
      }),
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/budget/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: rules.filter((r) => r.targetPct > 0) }),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-48 bg-muted/20 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/budget"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurar Orçamento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Defina o % da renda líquida por categoria
          </p>
        </div>
      </div>

      {/* Template button */}
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Regra 50/30/20</p>
          <p className="text-xs text-muted-foreground">
            Necessidades 50% · Qualidade de vida 30% · Investimentos 20%
          </p>
        </div>
        <button
          onClick={applyTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm text-foreground hover:bg-muted transition-colors whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Aplicar template
        </button>
      </div>

      {/* Category list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_110px_90px] gap-3 px-5 py-3 border-b border-border bg-muted/30">
          <span className="text-xs font-medium text-muted-foreground">Categoria</span>
          <span className="text-xs font-medium text-muted-foreground text-right">% da renda</span>
          <span className="text-xs font-medium text-muted-foreground text-right">Alerta em</span>
        </div>
        {rules.map((rule) => (
          <div
            key={rule.category}
            className="grid grid-cols-[1fr_110px_90px] gap-3 items-center px-5 py-3 border-b border-border last:border-b-0"
          >
            <span className="text-sm text-foreground">
              {CATEGORY_LABELS[rule.category] || rule.category}
            </span>
            <div className="flex items-center justify-end gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={rule.targetPct}
                onChange={(e) => update(rule.category, 'targetPct', Number(e.target.value))}
                className="w-16 rounded-md border border-border bg-background px-2 py-1 text-sm text-right text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <div className="flex items-center justify-end gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={rule.alertThresholdPct}
                onChange={(e) => update(rule.category, 'alertThresholdPct', Number(e.target.value))}
                className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-right text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Total indicator */}
      <div
        className={`rounded-xl border p-4 flex items-center justify-between ${
          isOverLimit ? 'border-expense bg-expense/10' : 'border-border bg-card'
        }`}
      >
        <span className="text-sm font-medium text-foreground">Total alocado</span>
        <span className={`text-sm font-bold ${isOverLimit ? 'text-expense' : 'text-foreground'}`}>
          {totalPct.toFixed(0)}%{isOverLimit && ' ⚠ acima de 100%'}
        </span>
      </div>

      <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-4 py-3">
        💡 A categoria <strong>Investimentos</strong> é gerenciada automaticamente no módulo de
        investimentos e não aparece nesta lista.
      </p>

      {/* Save */}
      <div className="flex items-center justify-between">
        {saved ? (
          <span className="text-sm font-medium" style={{ color: 'var(--income, #10b981)' }}>
            ✓ Configurações salvas
          </span>
        ) : (
          <span />
        )}
        <button
          onClick={save}
          disabled={saving || isOverLimit}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Salvando…' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  )
}
