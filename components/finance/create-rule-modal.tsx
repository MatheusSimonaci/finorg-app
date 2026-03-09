"use client"

import { useState } from "react"
import { X, AlertCircle, CheckCircle } from "lucide-react"

type Props = {
  description: string
  nature: string
  category: string
  type: string
  onClose: () => void
  onCreated?: (matchCount: number) => void
}

const NATURE_OPTIONS = ["pessoal", "empresa", "work_tool", "misto"]
const CATEGORY_OPTIONS = [
  "alimentacao", "assinatura", "educacao", "investimento", "lazer",
  "moradia", "outros", "pet", "receita", "saude", "servicos", "transporte",
]
const TYPE_OPTIONS = ["gasto", "investimento", "receita", "reserva", "transferencia"]

function suggestPattern(desc: string): string {
  // Extract the first meaningful word(s) — up to 20 chars, all caps words
  const clean = desc.toUpperCase().replace(/[^A-Z0-9\s]/g, "").trim()
  const words = clean.split(/\s+/).filter((w) => w.length > 2)
  return words.slice(0, 2).join("|") || clean.slice(0, 20)
}

export function CreateRuleModal({ description, nature: suggestedNature, category: suggestedCategory, type: suggestedType, onClose, onCreated }: Props) {
  const [pattern, setPattern] = useState(suggestPattern(description))
  const [nature, setNature] = useState(suggestedNature)
  const [category, setCategory] = useState(suggestedCategory)
  const [type, setType] = useState(suggestedType)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ matchCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/classification-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pattern, nature, category, type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
      } else {
        setResult({ matchCount: data.matchCount })
        onCreated?.(data.matchCount)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-background border border-border shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Criar regra permanente</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[300px]">
              baseada em &ldquo;{description}&rdquo;
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                Regra criada! {result.matchCount > 0 && `Se aplica a ${result.matchCount} transação(ões) no histórico.`}
              </p>
            </div>
            <button onClick={onClose} className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Fechar
            </button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Padrão (texto ou regex)
              </label>
              <input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                placeholder="ex: IFOOD|RAPPI"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sugestão baseada na descrição. Suporta regex.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Natureza", value: nature, options: NATURE_OPTIONS, set: setNature },
                { label: "Categoria", value: category, options: CATEGORY_OPTIONS, set: setCategory },
                { label: "Tipo", value: type, options: TYPE_OPTIONS, set: setType },
              ].map(({ label, value, options, set }) => (
                <div key={label}>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
                  <select
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-xs">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Agora não
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !pattern}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {saving ? "Salvando…" : "Criar regra"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
