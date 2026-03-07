"use client"

import { useCallback, useRef, useState } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

type ImportResult = {
  batchId: string
  bank: string
  imported: number
  duplicates: number
  errors: number
  parseErrors?: { row: number; error: string }[]
}

type ClassifyEstimate = {
  transactionCount: number
  costBRL: number
}

type Props = {
  onImportComplete?: (result: ImportResult) => void
}

const BANK_LABELS: Record<string, string> = {
  nubank: "Nubank",
  xp: "XP Investimentos",
  bitybank: "Bitybank",
}

export function CsvUpload({ onImportComplete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [phase, setPhase] = useState<"idle" | "parsing" | "classifying" | "done" | "error">("idle")
  const [result, setResult] = useState<ImportResult | null>(null)
  const [estimate, setEstimate] = useState<ClassifyEstimate | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Apenas arquivos .csv são aceitos")
      setPhase("error")
      return
    }

    setPhase("parsing")
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    const res = await fetch("/api/transactions/import", { method: "POST", body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? "Erro ao importar")
      setPhase("error")
      return
    }

    const importResult: ImportResult = data
    setResult(importResult)

    // Get cost estimate for classification
    if (importResult.imported > 0) {
      const estRes = await fetch("/api/transactions/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: importResult.batchId, estimateOnly: true }),
      })
      if (estRes.ok) setEstimate(await estRes.json())
    }

    setPhase("done")
    onImportComplete?.(importResult)
  }, [onImportComplete])

  const handleClassify = async () => {
    if (!result) return
    setPhase("classifying")
    await fetch("/api/transactions/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: result.batchId }),
    })
    setPhase("done")
    window.location.href = `/transactions/review/${result.batchId}`
  }

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ""
  }

  const reset = () => {
    setPhase("idle")
    setResult(null)
    setEstimate(null)
    setError(null)
  }

  if (phase === "parsing" || phase === "classifying") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/20 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">
          {phase === "parsing" ? "Processando CSV…" : "Classificando com IA…"}
        </p>
      </div>
    )
  }

  if (phase === "error") {
    return (
      <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-6 space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
        <button onClick={reset} className="text-xs text-muted-foreground underline">
          Tentar novamente
        </button>
      </div>
    )
  }

  if (phase === "done" && result) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm font-semibold">
            Arquivo importado — {BANK_LABELS[result.bank] ?? result.bank}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Importadas", value: result.imported, color: "text-green-600" },
            { label: "Duplicadas", value: result.duplicates, color: "text-amber-500" },
            { label: "Erros", value: result.errors, color: "text-destructive" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {result.parseErrors && result.parseErrors.length > 0 && (
          <div className="rounded-lg bg-destructive/5 p-3 space-y-1">
            <p className="text-xs font-medium text-destructive">Erros de parse:</p>
            {result.parseErrors.slice(0, 5).map((e) => (
              <p key={e.row} className="text-xs text-muted-foreground">
                Linha {e.row}: {e.error}
              </p>
            ))}
          </div>
        )}

        {result.imported > 0 && estimate && (
          <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Classificar com IA</p>
              <p className="text-xs text-muted-foreground">
                {estimate.transactionCount} transações · ~R$ {estimate.costBRL.toFixed(4)}
              </p>
            </div>
            <button
              onClick={handleClassify}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Brain className="h-4 w-4" />
              Classificar
            </button>
          </div>
        )}

        {result.imported > 0 && (
          <button
            onClick={() => window.location.href = `/transactions/review/${result.batchId}`}
            className="w-full text-sm text-muted-foreground underline text-center"
          >
            Revisar sem classificar
          </button>
        )}

        <button onClick={reset} className="text-xs text-muted-foreground underline">
          Importar outro arquivo
        </button>
      </div>
    )
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 cursor-pointer transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        {dragging ? (
          <FileText className="h-7 w-7 text-primary" />
        ) : (
          <Upload className="h-7 w-7 text-primary" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">
          {dragging ? "Solte o arquivo aqui" : "Arraste o CSV ou clique para selecionar"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Suporta: Nubank (conta corrente e cartão), XP Investimentos, Bitybank
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={onInputChange}
      />
    </div>
  )
}
