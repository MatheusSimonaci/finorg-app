'use client'

import { useEffect, useState } from 'react'
import {
  Camera,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  Globe,
  Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type PrivacyData = {
  privacyMode: 'public' | 'protected'
  maskValues: boolean
  hasPassword: boolean
  lastDeployUrl: string | null
  lastDeployedAt: string | null
  vercelConfigured: boolean
}

export default function SnapshotSettingsPage() {
  const [privacy, setPrivacy] = useState<PrivacyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [mode, setMode] = useState<'public' | 'protected'>('public')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [maskValues, setMaskValues] = useState(false)

  // Vercel token form
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [tokenConfigured, setTokenConfigured] = useState(false)
  const [savingToken, setSavingToken] = useState(false)

  // URL copy
  const [copied, setCopied] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/settings/snapshot-privacy').then((r) => r.json()),
      fetch('/api/settings/vercel-token').then((r) => r.json()),
    ]).then(([p, t]) => {
      setPrivacy(p)
      setMode(p.privacyMode)
      setMaskValues(p.maskValues)
      setTokenConfigured(t.configured)
      setLoading(false)
    })
  }, [])

  async function savePrivacy() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    const body: Record<string, unknown> = { privacyMode: mode, maskValues }
    if (mode === 'protected' && password) body.password = password
    const res = await fetch('/api/settings/snapshot-privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar configurações.')
    } else {
      setSuccess('Configurações salvas com sucesso.')
      setPassword('')
      // Refresh
      const fresh = await fetch('/api/settings/snapshot-privacy').then((r) => r.json())
      setPrivacy(fresh)
    }
    setSaving(false)
  }

  async function saveToken() {
    setSavingToken(true)
    setError(null)
    const res = await fetch('/api/settings/vercel-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenInput }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Erro ao salvar token.')
    } else {
      setTokenConfigured(true)
      setTokenInput('')
      setSuccess('Token Vercel salvo com sucesso.')
    }
    setSavingToken(false)
  }

  async function removeToken() {
    await fetch('/api/settings/vercel-token', { method: 'DELETE' })
    setTokenConfigured(false)
    setSuccess('Token removido.')
  }

  function copyUrl() {
    if (!privacy?.lastDeployUrl) return
    navigator.clipboard.writeText(privacy.lastDeployUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded border border-border bg-card" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Configurações do Snapshot
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Controle de privacidade e deploy para Vercel
        </p>
      </div>

      {/* ── Privacy warning ─── */}
      <div className="rounded-xl border border-warning/30 bg-warning/8 px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-warning leading-relaxed">
          O snapshot contém informações financeiras pessoais. Certifique-se de que a configuração de
          privacidade está correta antes de gerar ou publicar.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-expense/30 bg-expense/8 px-4 py-3 text-sm text-expense">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-income/30 bg-income/8 px-4 py-3 text-sm text-income">
          {success}
        </div>
      )}

      {/* ── Last deploy URL ─── */}
      {privacy?.lastDeployUrl && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Último Deploy
          </p>
          <div className="flex items-center gap-2">
            <a
              href={privacy.lastDeployUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1 min-w-0 truncate"
            >
              {privacy.lastDeployUrl}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
            <button
              onClick={copyUrl}
              className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded border border-border hover:bg-muted/40 transition-colors"
              title="Copiar URL"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-income" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          </div>
          {privacy.lastDeployedAt && (
            <p className="text-xs text-muted-foreground">
              {new Date(privacy.lastDeployedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
      )}

      {/* ── Privacy mode ─── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold">Visibilidade do Snapshot</h2>

        <div className="space-y-2">
          {([
            { val: 'public', label: 'Público', desc: 'Qualquer pessoa com a URL pode acessar', Icon: Globe },
            { val: 'protected', label: 'Protegido por senha', desc: 'Exibe formulário de senha antes do conteúdo', Icon: Lock },
          ] as const).map(({ val, label, desc, Icon }) => (
            <label
              key={val}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                mode === val ? 'border-primary/60 bg-primary/5' : 'border-border hover:bg-muted/30',
              )}
            >
              <input
                type="radio"
                name="mode"
                value={val}
                checked={mode === val}
                onChange={() => setMode(val)}
                className="accent-primary"
              />
              <Icon className={cn('h-4 w-4 flex-shrink-0', mode === val ? 'text-primary' : 'text-muted-foreground')} />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        {mode === 'protected' && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {privacy?.hasPassword ? 'Nova senha (deixe em branco para manter a atual)' : 'Senha'}
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={privacy?.hasPassword ? '••••••' : 'Mínimo 4 caracteres'}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Mask values toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={maskValues}
            onChange={(e) => setMaskValues(e.target.checked)}
            className="accent-primary w-4 h-4"
          />
          <div>
            <p className="text-sm font-medium">Ocultar valores exatos</p>
            <p className="text-xs text-muted-foreground">
              Substitui valores monetários por ●●●● — útil para compartilhar sem revelar patrimônio
            </p>
          </div>
        </label>

        <button
          onClick={savePrivacy}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Salvando…' : 'Salvar Configurações'}
        </button>
      </div>

      {/* ── Vercel token ─── */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div>
          <h2 className="text-sm font-semibold">Token Vercel</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Necessário para o deploy automático. O token é armazenado criptografado.
          </p>
        </div>

        {tokenConfigured ? (
          <div className="flex items-center justify-between rounded-lg border border-income/30 bg-income/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-income" />
              <span className="text-sm text-income font-medium">Token configurado</span>
            </div>
            <button
              onClick={removeToken}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-expense transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Cole seu Vercel API Token aqui"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:border-primary font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={saveToken}
              disabled={savingToken || tokenInput.trim().length < 20}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {savingToken ? 'Salvando…' : 'Salvar Token'}
            </button>
            <p className="text-xs text-muted-foreground">
              Obtenha o token em{' '}
              <span className="text-primary">vercel.com/account/tokens</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
