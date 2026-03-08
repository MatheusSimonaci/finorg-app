'use client'

import { useState } from 'react'
import { X, Calendar, Target, AlignLeft, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

type DreamFormData = {
  name: string
  targetAmount: string
  targetDate: string
  priorityOrder: string
  notes: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  initial?: {
    id: string
    name: string
    targetAmount: number
    targetDate: string | null
    priorityOrder: number
    notes: string | null
  } | null
}

const EXAMPLES = ['🚗 Carro novo', '✈️ Viagem dos sonhos', '🏠 Imóvel próprio', '🏖️ Aposentadoria antecipada']

export function DreamForm({ open, onClose, onSaved, initial }: Props) {
  const [form, setForm] = useState<DreamFormData>({
    name: initial?.name ?? '',
    targetAmount: initial?.targetAmount ? String(initial.targetAmount) : '',
    targetDate: initial?.targetDate ? initial.targetDate.slice(0, 7) : '', // YYYY-MM
    priorityOrder: initial?.priorityOrder ? String(initial.priorityOrder) : '',
    notes: initial?.notes ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function set(field: keyof DreamFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.targetAmount) { setError('Preencha nome e valor'); return }
    setSaving(true); setError('')

    try {
      const body = {
        name: form.name.trim(),
        targetAmount: parseFloat(form.targetAmount.replace(',', '.')),
        targetDate: form.targetDate ? `${form.targetDate}-01` : null,
        priorityOrder: form.priorityOrder ? parseInt(form.priorityOrder) : undefined,
        notes: form.notes.trim() || null,
      }

      const url = initial ? `/api/dreams/${initial.id}` : '/api/dreams'
      const method = initial ? 'PUT' : 'POST'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      onSaved()
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold mb-4">{initial ? 'Editar sonho' : 'Novo sonho'}</h2>

        {!initial && !form.name && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Exemplos:</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => set('name', ex)}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:bg-muted transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Target className="h-3 w-3" /> Nome do sonho</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="ex: Viagem para Europa"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><span className="font-mono">R$</span> Valor alvo</label>
            <input
              type="number"
              value={form.targetAmount}
              onChange={(e) => set('targetAmount', e.target.value)}
              placeholder="ex: 15000"
              min="1"
              step="0.01"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Prazo (mês/ano)</label>
              <input
                type="month"
                value={form.targetDate}
                onChange={(e) => set('targetDate', e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Hash className="h-3 w-3" /> Prioridade</label>
              <input
                type="number"
                value={form.priorityOrder}
                onChange={(e) => set('priorityOrder', e.target.value)}
                placeholder="auto"
                min="1"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><AlignLeft className="h-3 w-3" /> Observações (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={2}
              placeholder="Detalhes do sonho..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Salvando…' : initial ? 'Salvar' : 'Criar sonho'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
