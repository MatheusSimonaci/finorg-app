'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CalendarClock, ChevronLeft, Plus, Repeat, Trash2 } from 'lucide-react'
import { CashflowPreview } from '@/components/finance/cashflow-preview'
import { CATEGORY_LABELS } from '@/lib/constants'
import { currentMonth } from '@/lib/date-utils'

type RecurringItem = {
  id: string
  name: string
  type: string
  amount: number
  category: string
  totalInstallments: number | null
  currentInstallment: number | null
  startDate: string | null
  monthOfYear: number | null
  notes: string | null
}

type Suggestion = {
  description: string
  amount: number
  category: string | null
  count: number
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const EMPTY_FORM = {
  name: '',
  type: 'installment',
  amount: '',
  category: 'outros',
  totalInstallments: '',
  currentInstallment: '1',
  startDate: '',
  monthOfYear: '',
}

export default function RecurringPage() {
  const [items, setItems] = useState<RecurringItem[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [averageIncome, setAverageIncome] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/recurring-expenses?suggestions=true').then((r) => r.json()),
      fetch(`/api/dashboard?month=${currentMonth()}`).then((r) => r.json()),
    ])
      .then(([{ expenses, suggestions: sugg }, dash]) => {
        setItems(expenses)
        setSuggestions(sugg)
        setAverageIncome(dash.personalIncome || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    await fetch(`/api/recurring-expenses/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.category) return
    setSaving(true)
    try {
      const body = {
        name: form.name,
        type: form.type,
        amount: parseFloat(form.amount),
        category: form.category,
        totalInstallments: form.totalInstallments ? parseInt(form.totalInstallments) : null,
        // store 0-indexed: user enters "3" (3rd installment), store 2
        currentInstallment: form.currentInstallment ? parseInt(form.currentInstallment) - 1 : null,
        startDate: form.startDate || null,
        monthOfYear: form.monthOfYear ? parseInt(form.monthOfYear) : null,
      }
      const res = await fetch('/api/recurring-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const created = await res.json()
        setItems((prev) => [created, ...prev])
        setForm(EMPTY_FORM)
        setShowForm(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/budget"
          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Parcelas e Sazonais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Compromissos financeiros futuros</p>
        </div>
      </div>

      {/* Cashflow preview */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Próximos 3 meses</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/20 h-36 animate-pulse" />
            ))}
          </div>
        ) : (
          <CashflowPreview expenses={items} averageIncome={averageIncome} currentMonth={currentMonth()} />
        )}
      </div>

      {/* Auto-detected suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Repeat className="h-4 w-4 text-primary" />
            Recorrências detectadas
          </h2>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.description} className="flex items-center justify-between text-sm gap-3">
                <div>
                  <p className="text-foreground font-medium">{s.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ·
                    detectado em {s.count} meses
                  </p>
                </div>
                <button
                  onClick={() => {
                    setForm({
                      ...EMPTY_FORM,
                      name: s.description,
                      amount: s.amount.toFixed(2),
                      category: s.category || 'outros',
                      type: 'installment',
                    })
                    setShowForm(true)
                  }}
                  className="text-xs text-primary hover:underline whitespace-nowrap"
                >
                  Cadastrar →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List + add form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Cadastrados ({items.length})
          </h2>
          <button
            onClick={() => {
              setForm(EMPTY_FORM)
              setShowForm(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Novo compromisso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Nome *</label>
                <input
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: iPhone parcelado"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Tipo *</label>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="installment">Parcelado</option>
                  <option value="seasonal">Sazonal / Anual</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">
                  {form.type === 'installment' ? 'Valor da parcela *' : 'Valor estimado *'}
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Categoria *</label>
                <select
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {form.type === 'installment' && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">
                      Total de parcelas
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.totalInstallments}
                      onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">
                      Parcela atual
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.currentInstallment}
                      onChange={(e) => setForm({ ...form, currentInstallment: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-muted-foreground font-medium">
                      Data da 1ª parcela
                    </label>
                    <input
                      type="date"
                      className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>
                </>
              )}

              {form.type === 'seasonal' && (
                <div>
                  <label className="text-xs text-muted-foreground font-medium">
                    Mês de ocorrência
                  </label>
                  <select
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none"
                    value={form.monthOfYear}
                    onChange={(e) => setForm({ ...form, monthOfYear: e.target.value })}
                  >
                    <option value="">Selecionar mês</option>
                    {MONTH_NAMES.map((n, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.amount}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false)
                  setForm(EMPTY_FORM)
                }}
                className="px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Items list */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-muted/20 h-16 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <CalendarClock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum compromisso cadastrado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                      item.type === 'installment' ? 'bg-investment/10' : 'bg-warning/10'
                    }`}
                  >
                    {item.type === 'installment' ? (
                      <Repeat className="h-4 w-4 text-investment" />
                    ) : (
                      <CalendarClock className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABELS[item.category] || item.category}
                      {item.type === 'installment' &&
                        item.totalInstallments != null &&
                        item.currentInstallment != null && (
                          <span>
                            {' '}
                            · parcela {item.currentInstallment + 1}/{item.totalInstallments}
                          </span>
                        )}
                      {item.type === 'seasonal' && item.monthOfYear != null && (
                        <span> · {MONTH_NAMES[item.monthOfYear - 1]}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {item.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-md hover:bg-expense/10 text-muted-foreground hover:text-expense transition-colors"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
