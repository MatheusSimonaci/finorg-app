"use client"

import { useState, useRef } from "react"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { ChevronDown, ChevronUp, RefreshCw, Pencil, Trash2 } from "lucide-react"
import { TransactionModal } from "./transaction-modal"

const NATURE_OPTIONS = ["pessoal", "empresa", "work_tool", "misto"]
const CATEGORY_OPTIONS = [
  "alimentacao", "assinatura", "doacao", "educacao", "investimento", "lazer",
  "moradia", "outros", "pet", "receita", "saude", "servicos", "transporte",
]
const TYPE_OPTIONS = ["gasto", "investimento", "receita", "reserva", "transferencia"]

type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  nature: string | null
  category: string | null
  subcategory: string | null
  type: string | null
  confidence: number | null
  reasoning: string | null
  isReimbursable: boolean
  classificationSource: string | null
  reviewStatus: string
  account: { institution: string; name: string }
}

type Props = {
  tx: Transaction
  onUpdated: (updated: Partial<Transaction>) => void
  onDeleted: () => void
  onRuleCreate?: (description: string, nature: string, category: string, type: string) => void
}

const INSTITUTION_LABEL: Record<string, string> = {
  nubank: "Nubank",
  xp: "XP",
  bitybank: "BIT",
}

function InlineSelect({
  value,
  options,
  onChange,
  className,
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-md border border-border bg-background px-2 py-1 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export function TransactionRow({ tx, onUpdated, onDeleted, onRuleCreate }: Props) {
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [subcategory, setSubcategory] = useState(tx.subcategory ?? "")
  const [showEditModal, setShowEditModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const confidence = tx.confidence ?? 0
  const isPending = tx.reviewStatus === "pending"
  const isOverridden = tx.reviewStatus === "overridden"

  async function patchField(field: string, value: unknown) {
    setSaving(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/transactions/${tx.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [field]: value }),
        })
        const updated = await res.json()
        onUpdated(updated)
        if (onRuleCreate && (field === "nature" || field === "category" || field === "type")) {
          const nat = field === "nature" ? (value as string) : (tx.nature ?? "pessoal")
          const cat = field === "category" ? (value as string) : (tx.category ?? "outros")
          const typ = field === "type" ? (value as string) : (tx.type ?? "gasto")
          onRuleCreate(tx.description, nat, cat, typ)
        }
      } finally {
        setSaving(false)
      }
    }, 500)
  }

  return (
    <>
    {showEditModal && (
      <TransactionModal
        initialData={{
          id: tx.id,
          date: tx.date.slice(0, 10),
          description: tx.description,
          amount: String(tx.amount),
          accountId: tx.account ? undefined : undefined, // will default to first account
          nature: tx.nature ?? "pessoal",
          category: tx.category ?? "outros",
          subcategory: tx.subcategory ?? "",
          type: tx.type ?? "gasto",
          isReimbursable: tx.isReimbursable,
        }}
        onClose={() => setShowEditModal(false)}
        onSaved={(updated) => { onUpdated(updated as Partial<Transaction>); setShowEditModal(false) }}
      />
    )}
    <tr className={cn("border-b border-border text-sm transition-colors hover:bg-muted/30",
      isPending && "bg-amber-50/30 dark:bg-amber-900/10",
      expanded && "bg-muted/20"
    )}>
      {/* Date */}
      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
        {formatDate(tx.date)}
      </td>

      {/* Description */}
      <td className="px-3 py-2 max-w-[220px] overflow-hidden">
        <div className="flex items-start gap-1">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title={expanded ? "Ocultar detalhes" : "Ver detalhes"}
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <div className="min-w-0 overflow-hidden">
            <p className="truncate font-medium text-foreground" title={tx.description}>{tx.description}</p>
            <p className="text-[10px] text-muted-foreground">
              {expanded ? "clique para ocultar" : "clique para ver detalhes"}
            </p>
          </div>
        </div>
      </td>

      {/* Amount */}
      <td className={cn("px-3 py-2 text-right font-mono font-medium whitespace-nowrap",
        tx.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
      )}>
        {formatCurrency(tx.amount)}
      </td>

      {/* Account */}
      <td className="px-3 py-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
          {INSTITUTION_LABEL[tx.account.institution] ?? tx.account.institution}
        </span>
      </td>

      {/* Nature */}
      <td className="px-3 py-2">
        <InlineSelect
          value={tx.nature ?? "pessoal"}
          options={NATURE_OPTIONS}
          onChange={(v) => { onUpdated({ nature: v }); patchField("nature", v) }}
        />
      </td>

      {/* Category */}
      <td className="px-3 py-2">
        <InlineSelect
          value={tx.category ?? "outros"}
          options={CATEGORY_OPTIONS}
          onChange={(v) => { onUpdated({ category: v }); patchField("category", v) }}
        />
      </td>

      {/* Type */}
      <td className="px-3 py-2">
        <InlineSelect
          value={tx.type ?? "gasto"}
          options={TYPE_OPTIONS}
          onChange={(v) => { onUpdated({ type: v }); patchField("type", v) }}
        />
      </td>

      {/* Confidence + status */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-medium",
            isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            : isOverridden ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
          )}>
            {isPending ? "⚠ Revisar" : isOverridden ? "✏ Editada" : "✓ Ok"}
          </span>
          <span className="text-xs text-muted-foreground">
            {(confidence * 100).toFixed(0)}%
          </span>
          {tx.classificationSource && (
            <span className={cn(
              "text-[10px] px-1 rounded",
              tx.classificationSource === "rule" ? "text-blue-500" : "text-purple-500"
            )}>
              {tx.classificationSource === "rule" ? "regra" : tx.classificationSource === "ai" ? "IA" : "manual"}
            </span>
          )}
          {saving && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
      </td>

      {/* Reimbursable */}
      <td className="px-3 py-2 text-center">
        {(tx.nature === "empresa" || tx.nature === "work_tool") && (
          <input
            type="checkbox"
            checked={tx.isReimbursable}
            onChange={(e) => { onUpdated({ isReimbursable: e.target.checked }); patchField("isReimbursable", e.target.checked) }}
            className="h-3.5 w-3.5 accent-primary cursor-pointer"
            title="Reembolsável pela empresa"
          />
        )}
      </td>

      {/* Actions */}
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowEditModal(true)}
            className="rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Editar transação"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={async () => {
                  setDeleting(true)
                  await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" })
                  setDeleting(false)
                  setConfirmDelete(false)
                  onDeleted()
                }}
                disabled={deleting}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {deleting ? "…" : "Confirmar"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium border border-border hover:bg-muted"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir transação"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>

    {/* Expanded detail panel */}
    {expanded && (
      <tr className="border-b border-border bg-muted/10">
        <td colSpan={10} className="px-4 py-3">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {/* Full description */}
            <div className="col-span-2 md:col-span-3 lg:col-span-4">
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Descrição completa</p>
              <p className="text-sm font-medium break-words">{tx.description}</p>
            </div>

            {/* Full reasoning */}
            {tx.reasoning && (
              <div className="col-span-2 md:col-span-3 lg:col-span-4">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Raciocínio da IA</p>
                <p className="text-xs text-muted-foreground break-words rounded-md bg-muted/40 p-2">{tx.reasoning}</p>
              </div>
            )}

            {/* Account */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Conta</p>
              <p className="text-xs">{tx.account.name} ({INSTITUTION_LABEL[tx.account.institution] ?? tx.account.institution})</p>
            </div>

            {/* Confidence bar */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Confiança da IA</p>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all",
                      confidence >= 0.75 ? "bg-green-500" : confidence >= 0.5 ? "bg-amber-500" : "bg-destructive"
                    )}
                    style={{ width: `${(confidence * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{(confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Classification source */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Classificado por</p>
              <p className="text-xs">
                {tx.classificationSource === "rule" ? "Regra automática" : tx.classificationSource === "ai" ? "IA (OpenAI)" : tx.classificationSource === "manual" ? "Manual" : "—"}
              </p>
            </div>

            {/* Subcategory */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Subcategoria</p>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => {
                  setSubcategory(e.target.value)
                  patchField("subcategory", e.target.value || null)
                }}
                placeholder="ex: mercado, ifood…"
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </td>
      </tr>
    )}
    </>
  )
}
