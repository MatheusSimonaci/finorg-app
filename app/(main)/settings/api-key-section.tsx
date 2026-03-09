"use client"

import { useEffect, useState } from "react"
import { KeyRound, Eye, EyeOff, Save, CheckCircle } from "lucide-react"

export function ApiKeySection() {
  const [key, setKey] = useState("")
  const [masked, setMasked] = useState(true)
  const [current, setCurrent] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/config?key=OPENAI_API_KEY")
      .then((r) => r.json())
      .then((d) => { if (d.value) setCurrent(d.value) })
  }, [])

  async function save() {
    if (!key.trim()) return
    setSaving(true)
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "OPENAI_API_KEY", value: key.trim() }),
    })
    setCurrent(`****${key.trim().slice(-4)}`)
    setKey("")
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Inteligência Artificial</h2>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">OpenAI API Key</p>
            {current && (
              <p className="text-xs text-muted-foreground">Atual: {current}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={masked ? "password" : "text"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
            <button
              onClick={() => setMasked((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {masked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          <button
            onClick={save}
            disabled={saving || !key.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 hover:bg-primary/90"
          >
            {saved ? <CheckCircle className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Salvo" : saving ? "Salvando…" : "Salvar"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          A chave é armazenada localmente no banco de dados. Nunca é enviada a terceiros além da OpenAI.
        </p>
      </div>
    </div>
  )
}
