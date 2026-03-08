"use client"

import { useState, useEffect } from "react"
import { Upload, RefreshCw, Filter, X, Plus } from "lucide-react"
import Link from "next/link"
import { cn, formatCurrency } from "@/lib/utils"
import { TransactionRow } from "@/components/finance/transaction-row"
import { CreateRuleModal } from "@/components/finance/create-rule-modal"
import { TransactionModal } from "@/components/finance/transaction-modal"

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

type RuleModal = { description: string; nature: string; category: string; type: string } | null

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState("all")
  const [category, setCategory] = useState("all")
  const [nature, setNature] = useState("all")
  const [status, setStatus] = useState("all")
  const [ruleModal, setRuleModal] = useState<RuleModal>(null)
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    try {
      const res = await fetch("/api/transactions")
      const data = await res.json()
      setTransactions(data)
    } finally {
      setLoading(false)
    }
  }

  function updateTx(id: string, patch: Partial<Transaction>) {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  function deleteTx(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  function addTx(tx: Transaction) {
    setTransactions((prev) => [tx, ...prev])
  }

  const months = Array.from(new Set(
    transactions.map((t) => t.date.substring(0, 7))
  )).sort((a, b) => b.localeCompare(a))

  const categories = Array.from(new Set(
    transactions.map((t) => t.category).filter((c): c is string => !!c)
  )).sort()

  const filtered = transactions.filter((t) => {
    if (month !== "all" && !t.date.startsWith(month)) return false
    if (category !== "all" && t.category !== category) return false
    if (nature !== "all" && t.nature !== nature) return false
    if (status === "pending" && t.reviewStatus !== "pending") return false
    if (status === "approved" && t.reviewStatus === "pending") return false
    return true
  })

  const totalIncome = filtered.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)
  const pendingCount = filtered.filter((t) => t.reviewStatus === "pending").length
  const hasFilters = month !== "all" || category !== "all" || nature !== "all" || status !== "all"

  return (
    <div className="space-y-6 p-6">
      {ruleModal && (
        <CreateRuleModal
          {...ruleModal}
          onClose={() => setRuleModal(null)}
          onCreated={() => setRuleModal(null)}
        />
      )}

      {showNewModal && (
        <TransactionModal
          onClose={() => setShowNewModal(false)}
          onSaved={(tx) => { addTx(tx as Transaction); setShowNewModal(false) }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "Carregando…" : `${filtered.length} de ${transactions.length} transações`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Nova transação
          </button>
          <Link
            href="/transactions/import"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            Importar
          </Link>
        </div>
      </div>

      {/* Stats */}
      {!loading && transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Saídas</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(Math.abs(totalExpenses))}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Para revisar</p>
            <p className={cn("text-xl font-bold", pendingCount > 0 ? "text-amber-600" : "text-muted-foreground")}>
              {pendingCount}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {!loading && transactions.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os meses</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todas categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={nature}
            onChange={(e) => setNature(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todas naturezas</option>
            <option value="pessoal">Pessoal</option>
            <option value="empresa">Empresa</option>
            <option value="work_tool">Ferramenta</option>
            <option value="misto">Misto</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos status</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovadas</option>
          </select>

          {hasFilters && (
            <button
              onClick={() => { setMonth("all"); setCategory("all"); setNature("all"); setStatus("all") }}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-sm font-medium text-muted-foreground">Nenhuma transação importada ainda</p>
          <Link
            href="/transactions/import"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Upload className="h-4 w-4" />
            Importar primeiro extrato
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                {["Data", "Descrição", "Valor", "Conta", "Natureza", "Categoria", "Tipo", "Status", "Reimb.", ""].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-xs text-muted-foreground">
                    Nenhuma transação neste filtro
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    onUpdated={(patch) => updateTx(tx.id, patch)}
                    onDeleted={() => deleteTx(tx.id)}
                    onRuleCreate={(desc, nat, cat, typ) =>
                      setRuleModal({ description: desc, nature: nat, category: cat, type: typ })
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
