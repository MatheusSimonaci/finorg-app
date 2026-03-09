'use client'

import { useState } from 'react'
import { X, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { DreamCardData } from './dream-card'

type Asset = { id: string; name: string; type: string; currentValue: number }

type Props = {
  dream: DreamCardData
  assets: Asset[]
  onClose: () => void
  onRealized: (dreamId: string) => void
}

type Withdrawal = { assetId: string; amount: string }

export function RealizeDreamModal({ dream, assets, onClose, onRealized }: Props) {
  const availableAssets = assets.filter((a) => a.currentValue > 0)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(
    availableAssets.slice(0, 1).map((a) => ({ assetId: a.id, amount: '' }))
  )
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalWithdrawal = withdrawals.reduce((s, w) => s + (parseFloat(w.amount.replace(',', '.')) || 0), 0)

  function addLine() {
    setWithdrawals((prev) => [...prev, { assetId: availableAssets[0]?.id ?? '', amount: '' }])
  }

  function removeLine(i: number) {
    setWithdrawals((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateLine(i: number, field: keyof Withdrawal, value: string) {
    setWithdrawals((prev) => prev.map((w, idx) => idx === i ? { ...w, [field]: value } : w))
  }

  async function handleConfirm() {
    const parsed = withdrawals
      .filter((w) => w.assetId && parseFloat(w.amount.replace(',', '.')) > 0)
      .map((w) => ({ assetId: w.assetId, amount: parseFloat(w.amount.replace(',', '.')) }))

    if (parsed.length === 0) { setError('Informe pelo menos um ativo e valor'); return }

    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/dreams/${dream.id}/realize`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawals: parsed, notes: notes.trim() || null }),
      })
      if (!res.ok) throw new Error(await res.text())
      onRealized(dream.id)
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="text-center mb-5">
          <span className="text-4xl">🏆</span>
          <h2 className="text-xl font-bold mt-2">Realizando &ldquo;{dream.name}&rdquo;</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Valor alvo: <strong>{formatCurrency(dream.targetAmount)}</strong>
          </p>
        </div>

        <div className="space-y-3 mb-4">
          <p className="text-xs font-medium text-muted-foreground">De quais ativos o dinheiro sairá:</p>
          {withdrawals.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={w.assetId}
                onChange={(e) => updateLine(i, 'assetId', e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecionar ativo…</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(a.currentValue)})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={w.amount}
                onChange={(e) => updateLine(i, 'amount', e.target.value)}
                placeholder="Valor"
                min="0"
                step="0.01"
                className="w-32 rounded-lg border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {withdrawals.length > 1 && (
                <button onClick={() => removeLine(i)} className="text-destructive hover:text-destructive/80 p-1 rounded transition-colors">
                  <Minus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {availableAssets.length > withdrawals.length && (
            <button onClick={addLine} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="h-3 w-3" /> Adicionar ativo
            </button>
          )}
        </div>

        <div className="flex justify-between text-sm font-medium mb-4 px-1">
          <span className="text-muted-foreground">Total do saque:</span>
          <span className={totalWithdrawal > dream.targetAmount ? 'text-destructive' : 'text-foreground'}>
            {formatCurrency(totalWithdrawal)}
          </span>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Observação (opcional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ex: Comprei o carro em 07/03/2026"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && <p className="text-xs text-destructive mb-3">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-white" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Confirmando…' : '🏆 Confirmar realização'}
          </Button>
        </div>
      </div>
    </div>
  )
}
