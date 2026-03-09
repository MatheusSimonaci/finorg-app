'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, RefreshCw, Building2, TrendingUp, Filter, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/finance/kpi-card'
import { EmptyState } from '@/components/finance/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { AllocationDonut } from '@/components/finance/allocation-donut'
import { AllocationTable } from '@/components/finance/allocation-table'
import { PortfolioStateBadge } from '@/components/finance/portfolio-state-badge'
import { AssetForm } from '@/components/finance/asset-form'
import { UpdateValuesModal } from '@/components/finance/update-values-modal'
import { CategoryBadge } from '@/components/finance/category-badge'
import { assetLabel, assetColor, ASSET_PURPOSES } from '@/lib/investments/constants'
import { formatCurrency, formatPct, formatDate } from '@/lib/utils'
import { DreamModeBanner } from '@/components/finance/dream-mode-banner'
import type { AssetPurpose, PortfolioState } from '@/lib/investments/constants'
import type { AssetFormData } from '@/components/finance/asset-form'
import type { AllocationSlice } from '@/components/finance/allocation-donut'
import type { AllocationRow } from '@/components/finance/allocation-table'

type AssetRow = {
  id: string
  name: string
  type: string
  subtype: string | null
  institution: string
  currentValue: number
  lastUpdated: string
  staleDays: number
  purpose: AssetPurpose
  active: boolean
  pct: number
}

type SummaryData = {
  totalPortfolio: number
  personalPortfolio: number
  assetCount: number
  staleCount: number
  state: PortfolioState
  rebalanceProgress?: number
  allocation: Array<{ assetType: string; currentPct: number; targetPct: number }>
}

type PurposeFilter = 'all' | AssetPurpose

const PURPOSE_TABS: { key: PurposeFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'personal', label: 'Pessoal' },
  { key: 'business', label: 'Empresarial' },
  { key: 'reserve', label: 'Reserva' },
  { key: 'dream', label: 'Sonho' },
]

export default function InvestmentsPage() {
  const [assets, setAssets] = useState<AssetRow[]>([])
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [xpImporting, setXpImporting] = useState(false)
  const [xpResult, setXpResult] = useState<string | null>(null)
  const xpFileRef = useRef<HTMLInputElement>(null)

  async function handleXPImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setXpImporting(true)
    setXpResult(null)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/assets/import-xp', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setXpResult(`Erro: ${data.error}`)
      } else {
        setXpResult(`✓ ${data.assetsCreated} criados, ${data.assetsUpdated} atualizados — ${data.month}`)
        loadData()
      }
    } catch {
      setXpResult('Erro de rede ao importar.')
    }
    setXpImporting(false)
    if (xpFileRef.current) xpFileRef.current.value = ''
  }
  const [showForm, setShowForm] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [purposeFilter, setPurposeFilter] = useState<PurposeFilter>('all')

  const loadData = useCallback(async () => {
    const [assetsRes, summaryRes] = await Promise.all([
      fetch('/api/assets'),
      fetch('/api/investments/summary'),
    ])
    const rawAssets = await assetsRes.json()
    const summaryData: SummaryData = await summaryRes.json()
    const now = Date.now()
    const total = summaryData.totalPortfolio

    const rows: AssetRow[] = rawAssets.map((a: {
      id: string; name: string; type: string; subtype: string | null;
      institution: string; currentValue: number; lastUpdated: string; purpose: string; active: boolean
    }) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      subtype: a.subtype,
      institution: a.institution,
      currentValue: Number(a.currentValue),
      lastUpdated: a.lastUpdated,
      staleDays: Math.floor((now - new Date(a.lastUpdated).getTime()) / 86_400_000),
      purpose: a.purpose as AssetPurpose,
      active: a.active,
      pct: total > 0 ? (Number(a.currentValue) / total) * 100 : 0,
    }))

    setAssets(rows)
    setSummary(summaryData)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = purposeFilter === 'all' ? assets : assets.filter((a) => a.purpose === purposeFilter)

  const totalPortfolio = summary?.totalPortfolio ?? 0
  const personalPortfolio = summary?.personalPortfolio ?? 0
  const staleCount = summary?.staleCount ?? 0

  const allocationData: AllocationSlice[] = (summary?.allocation ?? []).map((d) => ({
    assetType: d.assetType,
    value: (d.currentPct / 100) * totalPortfolio,
    pct: d.currentPct,
  }))

  const allocationRows: AllocationRow[] = (summary?.allocation ?? []).map((d) => ({
    assetType: d.assetType,
    currentValue: (d.currentPct / 100) * totalPortfolio,
    currentPct: d.currentPct,
    targetPct: d.targetPct,
  }))

  const staleAssets = assets.filter((a) => a.staleDays > 0).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    institution: a.institution,
    currentValue: a.currentValue,
    lastUpdated: a.lastUpdated,
    staleDays: a.staleDays,
  }))

  async function handleCreateAsset(data: AssetFormData) {
    await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    await loadData()
  }

  async function handleUpdateValues(updates: Array<{ id: string; value: number }>) {
    await Promise.all(
      updates.map((u) =>
        fetch(`/api/assets/${u.id}/value`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: u.value }),
        }),
      ),
    )
    await loadData()
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <p className="text-sm text-muted-foreground">Carregando portfólio…</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Investimentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Portfólio e alocação de ativos</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Hidden file input for XP import */}
          <input
            ref={xpFileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleXPImport}
          />
          <Button
            variant="outline"
            size="sm"
            disabled={xpImporting}
            onClick={() => xpFileRef.current?.click()}
            title="Importar Posição Detalhada da XP (.xlsx)"
          >
            {xpImporting ? (
              <span className="h-3.5 w-3.5 mr-1.5 rounded-full border-2 border-primary border-t-transparent animate-spin inline-block" />
            ) : (
              <Upload className="h-3.5 w-3.5 mr-1.5" />
            )}
            Importar XP
          </Button>
          {assets.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowUpdate(true)}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Atualizar valores
              {staleCount > 0 && (
                <span className="ml-1.5 bg-warning/15 text-warning text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {staleCount}
                </span>
              )}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Novo ativo
          </Button>
        </div>
      </div>

      {/* ── Dream mode banner ── */}
      <DreamModeBanner />

      {/* ── XP import result ── */}
      {xpResult && (
        <div
          className={`rounded border px-4 py-2 text-sm flex items-center justify-between gap-3 ${
            xpResult.startsWith('Erro')
              ? 'border-expense/30 bg-expense/8 text-expense'
              : 'border-income/30 bg-income/8 text-income'
          }`}
        >
          <span>{xpResult}</span>
          <button
            onClick={() => setXpResult(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {assets.length === 0 ? (
        <EmptyState
          title="Nenhum ativo cadastrado"
          description="Adicione seus investimentos para acompanhar alocação, patrimônio e progresso dos sonhos."
          action={{ label: 'Adicionar primeiro ativo', href: '#' }}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Portfólio total"
              value={formatCurrency(totalPortfolio)}
              icon={<TrendingUp className="h-4 w-4" />}
              variant="investment"
            />
            <KpiCard
              label="Portfólio pessoal"
              value={formatCurrency(personalPortfolio)}
              icon={<TrendingUp className="h-4 w-4" />}
              variant="investment"
              subtext={formatPct(totalPortfolio > 0 ? (personalPortfolio / totalPortfolio) * 100 : 0) + ' do total'}
            />
            <KpiCard
              label="Qtd. de ativos"
              value={String(assets.length)}
              icon={<Building2 className="h-4 w-4" />}
              variant="default"
              subtext={staleCount > 0 ? `${staleCount} desatualizado${staleCount > 1 ? 's' : ''}` : 'Todos atualizados'}
            />
            <KpiCard
              label="Ativos pessoais"
              value={formatPct(totalPortfolio > 0 ? (personalPortfolio / totalPortfolio) * 100 : 0)}
              icon={<Filter className="h-4 w-4" />}
              variant="default"
            />
          </div>

          {/* ── Allocation + State ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Donut */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Alocação atual</h2>
                {summary && (
                  <PortfolioStateBadge
                    state={summary.state}
                    rebalanceProgress={summary.rebalanceProgress}
                  />
                )}
              </div>
              <AllocationDonut data={allocationData} totalValue={totalPortfolio} />
            </div>

            {/* Comparison table */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Atual vs. Target</h2>
                <a href="/investments/targets" className="text-xs text-primary hover:underline">
                  Configurar targets →
                </a>
              </div>
              {allocationRows.length > 0 ? (
                <AllocationTable rows={allocationRows} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Adicione ativos para ver a comparação
                </p>
              )}
            </div>
          </div>

          {/* ── Asset List ── */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-sm font-semibold text-foreground">Ativos</h2>
              {/* Purpose filter tabs */}
              <div className="flex items-center gap-1">
                {PURPOSE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setPurposeFilter(tab.key)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      purposeFilter === tab.key
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border">
                    <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Ativo</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Tipo</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Finalidade</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">% Portfólio</th>
                    <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Atualizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((asset) => (
                    <tr key={asset.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: assetColor(asset.type) }}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{asset.name}</p>
                            <p className="text-xs text-muted-foreground">{asset.institution}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">
                          {assetLabel(asset.type)}{asset.subtype ? ` · ${asset.subtype}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <CategoryBadge variant={ASSET_PURPOSES[asset.purpose]?.badge ?? 'muted'} size="sm">
                          {ASSET_PURPOSES[asset.purpose]?.label ?? asset.purpose}
                        </CategoryBadge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-foreground">
                        {formatCurrency(asset.currentValue)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ProgressBar value={asset.pct} showPercent size="sm" variant="investment" className="w-full" />
                      </td>
                      <td className="px-5 py-3 text-right hidden sm:table-cell">
                        {asset.staleDays > 30 ? (
                          <span className="text-[10px] font-medium text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">
                            ⚠ {asset.staleDays}d atrás
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(asset.lastUpdated)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Modals ── */}
      <AssetForm
        open={showForm}
        onOpenChange={setShowForm}
        onSave={handleCreateAsset}
      />
      <UpdateValuesModal
        assets={staleAssets}
        open={showUpdate}
        onOpenChange={setShowUpdate}
        onSave={handleUpdateValues}
      />
    </div>
  )
}

