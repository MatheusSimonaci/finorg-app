'use client'

import { useState } from 'react'
import { Camera, Rocket, Check, Copy, ExternalLink, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Phase = 'idle' | 'generating' | 'done' | 'deploying' | 'deployed' | 'error'

/** Small "📸 Gerar Snapshot" button with inline status feedback. */
export function SnapshotButton() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null)
  const [deployUrl, setDeployUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showDeploy, setShowDeploy] = useState(false)
  const [vercelConfigured, setVercelConfigured] = useState<boolean | null>(null)

  // Lazy-check if vercel token is set on first hover
  function checkVercel() {
    if (vercelConfigured !== null) return
    fetch('/api/settings/vercel-token')
      .then((r) => r.json())
      .then((d) => setVercelConfigured(d.configured))
      .catch(() => {})
  }

  async function generate() {
    setPhase('generating')
    setError(null)
    const res = await fetch('/api/snapshot/generate', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao gerar snapshot.')
      setPhase('error')
      return
    }
    setSnapshotUrl(data.path)
    setPhase('done')
    // Check vercel token status
    fetch('/api/settings/vercel-token')
      .then((r) => r.json())
      .then((d) => setVercelConfigured(d.configured))
      .catch(() => {})
  }

  async function deploy() {
    setPhase('deploying')
    setError(null)
    const res = await fetch('/api/snapshot/deploy', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao fazer deploy.')
      setPhase('done') // back to done so they can retry
      return
    }
    setDeployUrl(data.url)
    setPhase('deployed')
  }

  function copyUrl() {
    if (!deployUrl) return
    navigator.clipboard.writeText(deployUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function reset() {
    setPhase('idle')
    setError(null)
    setSnapshotUrl(null)
    setDeployUrl(null)
    setShowDeploy(false)
  }

  // ── Compact idle button ────────────────────────────────────────────────────
  if (phase === 'idle') {
    return (
      <button
        onClick={generate}
        onMouseEnter={checkVercel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-150"
      >
        <Camera className="h-3.5 w-3.5" />
        Gerar Snapshot
      </button>
    )
  }

  // ── Generating / deploying spinner ─────────────────────────────────────────
  if (phase === 'generating' || phase === 'deploying') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-border text-xs text-muted-foreground">
        <span className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin flex-shrink-0" />
        {phase === 'generating' ? 'Gerando snapshot…' : 'Publicando na Vercel…'}
      </div>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="flex items-center gap-2 rounded border border-expense/30 bg-expense/8 px-3 py-1.5 text-xs text-expense max-w-xs">
        <span className="flex-1 truncate">{error}</span>
        <button onClick={reset}><X className="h-3.5 w-3.5" /></button>
      </div>
    )
  }

  // ── Snapshot generated ────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="rounded border border-income/30 bg-income/5 px-3 py-2 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-income font-semibold">
            <Check className="h-3.5 w-3.5" />
            Snapshot gerado!
          </div>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {error && <p className="text-expense">{error}</p>}
        <div className="flex items-center gap-2">
          <a
            href={snapshotUrl ?? '/snapshot/index.html'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir snapshot
          </a>
          {vercelConfigured && !showDeploy && (
            <button
              onClick={() => setShowDeploy(true)}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary"
            >
              <Rocket className="h-3 w-3" />
              Deploy Vercel
            </button>
          )}
        </div>
        {showDeploy && (
          <button
            onClick={deploy}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary font-semibold hover:bg-primary/20 transition-colors"
          >
            <Rocket className="h-3.5 w-3.5" />
            Publicar na Vercel
          </button>
        )}
      </div>
    )
  }

  // ── Deployed ───────────────────────────────────────────────────────────────
  if (phase === 'deployed') {
    return (
      <div className="rounded border border-invest/30 bg-invest/5 px-3 py-2 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-invest font-semibold">
            <Check className="h-3.5 w-3.5" />
            Publicado na Vercel!
          </div>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={deployUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline min-w-0 truncate flex-1"
          >
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{deployUrl}</span>
          </a>
          <button
            onClick={copyUrl}
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-6 h-6 rounded border hover:bg-muted/40 transition-colors',
              copied ? 'border-income/40 text-income' : 'border-border text-muted-foreground',
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
    )
  }

  return null
}
