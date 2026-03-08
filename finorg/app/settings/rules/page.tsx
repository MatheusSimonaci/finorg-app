"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Rule = {
  id: string
  pattern: string
  nature: string
  category: string
  subcategory: string | null
  type: string | null
  source: string
  active: boolean
}

const SOURCE_LABEL: Record<string, string> = {
  system: "sistema",
  user: "usuário",
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [newPattern, setNewPattern] = useState("")
  const [newNature, setNewNature] = useState("pessoal")
  const [newCategory, setNewCategory] = useState("outros")
  const [newType, setNewType] = useState("gasto")
  const [adding, setAdding] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  useEffect(() => {
    fetch("/api/classification-rules")
      .then((r) => r.json())
      .then((data) => { setRules(data); setLoading(false) })
  }, [])

  async function toggleActive(rule: Rule) {
    const res = await fetch(`/api/classification-rules/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !rule.active }),
    })
    if (res.ok) {
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, active: !r.active } : r))
    }
  }

  async function deleteRule(id: string) {
    if (!confirm("Deletar esta regra?")) return
    await fetch(`/api/classification-rules/${id}`, { method: "DELETE" })
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  async function addRule() {
    if (!newPattern) return
    setAdding(true)
    const res = await fetch("/api/classification-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern: newPattern, nature: newNature, category: newCategory, type: newType }),
    })
    const data = await res.json()
    if (res.ok) {
      setRules((prev) => [...prev, data])
      setNewPattern("")
      setShowAdd(false)
    }
    setAdding(false)
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="rounded-lg p-2 hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Regras de Classificação</h1>
            <p className="text-xs text-muted-foreground">{rules.length} regras cadastradas</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova regra
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
          <p className="text-xs font-semibold">Nova regra</p>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Padrão (regex)</label>
              <input
                value={newPattern}
                onChange={(e) => setNewPattern(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="ex: IFOOD|RAPPI"
              />
            </div>
            {[
              { label: "Natureza", value: newNature, options: ["pessoal", "empresa", "work_tool", "misto"], set: setNewNature },
              { label: "Categoria", value: newCategory, options: ["alimentacao", "assinatura", "doacao", "educacao", "investimento", "lazer", "moradia", "outros", "pet", "receita", "saude", "servicos", "transporte"], set: setNewCategory },
            ].map(({ label, value, options, set }) => (
              <div key={label}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
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
          <div className="flex gap-2">
            <button
              onClick={addRule}
              disabled={adding || !newPattern}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              {adding ? "Salvando…" : "Criar regra"}
            </button>
            <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground underline">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                {["Padrão", "Natureza", "Categoria", "Tipo", "Origem", "Ativo", "Ações"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id} className={cn("border-b border-border hover:bg-muted/20", !rule.active && "opacity-50")}>
                  <td className="px-3 py-2 font-mono text-xs">{rule.pattern}</td>
                  <td className="px-3 py-2 text-xs">{rule.nature}</td>
                  <td className="px-3 py-2 text-xs">{rule.category}</td>
                  <td className="px-3 py-2 text-xs">{rule.type ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      rule.source === "system"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {SOURCE_LABEL[rule.source] ?? rule.source}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => toggleActive(rule)} className="text-muted-foreground hover:text-foreground">
                      {rule.active
                        ? <ToggleRight className="h-4 w-4 text-primary" />
                        : <ToggleLeft className="h-4 w-4" />
                      }
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    {rule.source !== "system" && (
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
