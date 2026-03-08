"use client"

import { useEffect, useState } from "react"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const NATURE_OPTIONS = ["pessoal", "empresa", "work_tool", "misto"]
const CATEGORY_OPTIONS = [
  "alimentacao", "assinatura", "doacao", "educacao", "investimento", "lazer",
  "moradia", "outros", "pet", "receita", "saude", "servicos", "transporte",
]
const TYPE_OPTIONS = ["gasto", "investimento", "receita", "reserva", "transferencia"]

type Account = { id: string; name: string; institution: string }

type TransactionFormData = {
  date: string
  description: string
  amount: string
  accountId: string
  nature: string
  category: string
  subcategory: string
  type: string
  isReimbursable: boolean
}

type Props = {
  /** When provided, the modal is in edit mode */
  initialData?: Partial<TransactionFormData> & { id?: string }
  onClose: () => void
  onSaved: (tx: unknown) => void
}

export function TransactionModal({ initialData, onClose, onSaved }: Props) {
  const isEdit = !!initialData?.id

  const [accounts, setAccounts] = useState<Account[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<TransactionFormData>({
    date: initialData?.date ?? new Date().toISOString().slice(0, 10),
    description: initialData?.description ?? "",
    amount: initialData?.amount ?? "",
    accountId: initialData?.accountId ?? "",
    nature: initialData?.nature ?? "pessoal",
    category: initialData?.category ?? "outros",
    subcategory: initialData?.subcategory ?? "",
    type: initialData?.type ?? "gasto",
    isReimbursable: initialData?.isReimbursable ?? false,
  })

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data: Account[]) => {
        setAccounts(data)
        if (!form.accountId && data.length > 0) {
          setForm((f) => ({ ...f, accountId: data[0].id }))
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set(field: keyof TransactionFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedAmount = parseFloat(form.amount)
    if (!form.description.trim()) return setError("Descrição obrigatória")
    if (isNaN(parsedAmount)) return setError("Valor inválido (use ponto como decimal, ex: -42.50)")
    if (!form.accountId) return setError("Selecione uma conta")

    setSaving(true)
    try {
      const url = isEdit ? `/api/transactions/${initialData!.id}` : "/api/transactions"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parsedAmount,
          subcategory: form.subcategory || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Erro ao salvar")
        return
      }

      onSaved(data)
      onClose()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">
            {isEdit ? "Editar transação" : "Nova transação"}
          </h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Valor * <span className="text-[10px] text-muted-foreground/70">(negativo = saída)</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="-42.50"
                required
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Descrição *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="ex: Mercado, Salário, Netflix…"
              required
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Account */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Conta *</label>
            <select
              value={form.accountId}
              onChange={(e) => set("accountId", e.target.value)}
              required
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {accounts.length === 0 && <option value="">Carregando…</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Nature */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Natureza</label>
              <select
                value={form.nature}
                onChange={(e) => set("nature", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {NATURE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            {/* Subcategory */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Subcategoria</label>
              <input
                type="text"
                value={form.subcategory}
                onChange={(e) => set("subcategory", e.target.value)}
                placeholder="ex: ifood, farmácia…"
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Reimbursable */}
          {(form.nature === "empresa" || form.nature === "work_tool") && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.isReimbursable}
                onChange={(e) => set("isReimbursable", e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-xs text-muted-foreground">Reembolsável pela empresa</span>
            </label>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                saving ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/90"
              )}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Criar transação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
