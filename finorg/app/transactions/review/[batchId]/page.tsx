"use client"

import { useEffect, useState, use } from "react"
import { TransactionRow } from "@/components/finance/transaction-row"
import { CreateRuleModal } from "@/components/finance/create-rule-modal"
import { ArrowLeft, CheckCheck, CheckCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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

type Filter = "all" | "pending" | "approved"

export default function ReviewPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = use(params)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [ruleModal, setRuleModal] = useState<{
    description: string; nature: string; category: string; type: string
  } | null>(null)

  useEffect(() => {
    fetch(`/api/transactions?batchId=${batchId}`)
      .then((r) => r.json())
      .then((data) => { setTransactions(data); setLoading(false) })
  }, [batchId])

  function updateTx(id: string, patch: Partial<Transaction>) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  async function approveAll() {
    const res = await fetch("/api/transactions/approve-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId }),
    })
    const data = await res.json()
    if (data.approved > 0) {
      setTransactions((prev) =>
        prev.map((t) =>
          t.reviewStatus === "pending" && (t.confidence ?? 0) >= 0.75
            ? { ...t, reviewStatus: "approved" }
            : t
        )
      )
    }
  }

  const pending = transactions.filter((t) => t.reviewStatus === "pending")
  const approved = transactions.filter((t) => t.reviewStatus !== "pending")
  const noPending = pending.length === 0

  const filtered = filter === "pending" ? pending : filter === "approved" ? approved : transactions

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Carregando transações…</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      {ruleModal && (
        <CreateRuleModal
          {...ruleModal}
          onClose={() => setRuleModal(null)}
          onCreated={() => setRuleModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/transactions" className="rounded-lg p-2 hover:bg-muted">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Revisão de Importação</h1>
          <p className="text-xs text-muted-foreground">
            {transactions.length} importadas · {approved.length} aprovadas · {pending.length} aguardando revisão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={approveAll}
            disabled={pending.filter((t) => (t.confidence ?? 0) >= 0.75).length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Aprovar tudo seguro
          </button>
          <Link
            href="/transactions"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
              noPending
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed pointer-events-none opacity-50"
            )}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Confirmar importação
          </Link>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {(["all", "pending", "approved"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 text-xs font-medium transition-colors",
              filter === f
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? `Todas (${transactions.length})` : f === "pending" ? `Revisar (${pending.length})` : `Aprovadas (${approved.length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              {["Data", "Descrição", "Valor", "Conta", "Natureza", "Categoria", "Tipo", "Status", "Reimb."].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-xs text-muted-foreground">
                  Nenhuma transação neste filtro
                </td>
              </tr>
            )}
            {filtered.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onUpdated={(patch) => updateTx(tx.id, patch)}
                onDeleted={() => setTransactions((prev) => prev.filter((t) => t.id !== tx.id))}
                onRuleCreate={(desc, nature, category, type) =>
                  setRuleModal({ description: desc, nature, category, type })
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
