'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  Landmark,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { EmptyState } from '@/components/finance/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'
import { SnapshotButton } from '@/components/snapshot/snapshot-button'
import { ExpensesDonut } from '@/components/finance/expenses-donut'
import { currentMonth, formatMonth, lastNMonths } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

type DashboardData = {
  month: string
  personalIncome: number
  personalExpenses: number
  invested: number
  netBalance: number
  budgetPercent: number
  budgetTarget: number
  lastImportDate: string | null
  expensesChart: Array<{ category: string; amount: number; pct: number }>
  alertsCount: number
  alerts: Array<{ id: string; title: string; message: string; severity: 'warning' | 'critical' }>
  pendingCount: number
  hasData: boolean
}

type MonthHistory = { month: string; netBalance: number; personalExpenses: number }

// ─── Month abbreviations ─────────────────────────────────────────────────────
const MONTH_ABBR = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
function abbr(month: string) {
  const [, mo] = month.split('-').map(Number)
  return MONTH_ABBR[mo - 1]
}
function compactCurrency(v: number) {
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : '+'
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`
  return `${sign}${abs.toFixed(0)}`
}

// ─── Month strip ─────────────────────────────────────────────────────────────
function MonthStrip({
  months,
  selected,
  onSelect,
  history,
  hidden,
}: {
  months: string[]
  selected: string
  onSelect: (m: string) => void
  history: MonthHistory[]
  hidden: boolean
}) {
  const now = currentMonth()
  const scrollRef = useRef<HTMLDivElement>(null)
  const maxExpenses = Math.max(...history.map((h) => h.personalExpenses), 1)

  // Auto-scroll active month into view
  useEffect(() => {
    const el = scrollRef.current?.querySelector('[data-active="true"]') as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selected])

  return (
    <div
      ref={scrollRef}
      className="flex gap-1 overflow-x-auto pb-0.5"
      style={{ scrollbarWidth: 'none' }}
    >
      {months.map((m) => {
        const h = history.find((x) => x.month === m)
        const barH = h ? Math.max((h.personalExpenses / maxExpenses) * 28, 3) : 3
        const isActive = m === selected
        const isFuture = m > now

        return (
          <button
            key={m}
            data-active={isActive}
            onClick={() => !isFuture && onSelect(m)}
            disabled={isFuture}
            className={cn(
              'flex flex-col items-center gap-1 px-2 py-2 rounded flex-shrink-0 transition-all duration-150 min-w-[52px] group',
              isActive
                ? 'bg-primary/10 border border-primary/40 text-primary'
                : isFuture
                ? 'opacity-25 cursor-not-allowed text-muted-foreground'
                : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-transparent',
            )}
          >
            {/* Spend bar */}
            <div className="flex items-end justify-center w-full h-7">
              <div
                className={cn(
                  'w-2.5 rounded-sm transition-all duration-300',
                  isActive ? 'bg-primary/60' : 'bg-muted-foreground/25 group-hover:bg-muted-foreground/40',
                )}
                style={{ height: `${barH}px` }}
              />
            </div>

            {/* Month label */}
            <span className="text-[9px] font-bold tracking-[0.06em]">{abbr(m)}</span>

            {/* Net balance */}
            {h ? (
              <span
                className={cn(
                  'text-[8px] tabular-nums leading-none font-medium',
                  hidden ? 'text-muted-foreground/50' : h.netBalance >= 0 ? 'text-income/75' : 'text-expense/75',
                )}
              >
                {hidden ? '••' : compactCurrency(h.netBalance)}
              </span>
            ) : (
              <span className="text-[8px] leading-none text-muted-foreground/40">—</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Metric panel ─────────────────────────────────────────────────────────────
function MetricPanel({
  label,
  value,
  icon,
  colorClass,
  borderClass,
  glowClass = '',
}: {
  label: string
  value: string
  icon: React.ReactNode
  colorClass: string
  borderClass: string
  glowClass?: string
}) {
  return (
    <div className={cn('relative rounded border bg-card p-4 space-y-2', borderClass)}>
      {/* Holographic corner brackets */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-[1.5px] border-l-[1.5px] border-holo/50 hidden dark:block" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-[1.5px] border-r-[1.5px] border-holo/50 hidden dark:block" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[1.5px] border-l-[1.5px] border-holo/50 hidden dark:block" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[1.5px] border-r-[1.5px] border-holo/50 hidden dark:block" />
      <div className="flex items-center gap-2">
        <div className={cn('flex-shrink-0', colorClass)}>{icon}</div>
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
          {label}
        </span>
      </div>
      <p className={cn('text-2xl font-bold tabular-nums tracking-tight', colorClass, glowClass)}>{value}</p>
    </div>
  )
}

const HIDDEN_PLACEHOLDER = '••••••'

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [month, setMonth] = useState(currentMonth())
  const [data, setData] = useState<DashboardData | null>(null)
  const [history, setHistory] = useState<MonthHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [hidden, setHidden] = useState(false)

  // Persist hide preference across page reloads
  useEffect(() => {
    const saved = localStorage.getItem('finorg:hideValues')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === 'true') setHidden(true)
  }, [])
  const toggleHidden = () => {
    setHidden((prev) => {
      localStorage.setItem('finorg:hideValues', String(!prev))
      return !prev
    })
  }

  const months12 = lastNMonths(12)

  // Load 12-month history once on mount
  useEffect(() => {
    fetch('/api/dashboard/history?months=12')
      .then((r) => r.json())
      .then((d: { history: MonthHistory[] }) => setHistory(d.history ?? []))
      .catch(() => {})
  }, [])

  // Reload selected-month detail whenever month changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(`/api/dashboard?month=${month}`)
      .then((r) => r.json())
      .then((d: DashboardData) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [month])

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const mask = (formatted: string) => hidden ? HIDDEN_PLACEHOLDER : formatted
  const fmtDate = (iso: string) => {
    const d = new Date(iso)
    return (
      d.toLocaleDateString('pt-BR') +
      ' às ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    )
  }

  const balance = data?.netBalance ?? 0

  return (
    <div className="p-4 sm:p-6 space-y-4">

      {/* Snapshot button row */}
      <div className="flex justify-end">
        <SnapshotButton />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          HERO — SALDO LÍQUIDO + MONTH STRIP
          ══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded border border-primary/20 bg-card overflow-hidden holo-card">
        {/* Holographic corner brackets — HUD panel indicators */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-holo/70 hidden dark:block z-10" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-holo/70 hidden dark:block z-10" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-holo/70 hidden dark:block z-10" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-holo/70 hidden dark:block z-10" />
        {/* Holographic radar sweep */}
        <div className="holo-scan-line hidden dark:block" />
        {/* Thin yellow top accent */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="p-5 space-y-5">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold tracking-[0.28em] uppercase text-muted-foreground">
                Saldo Líquido
              </span>
              <button
                onClick={toggleHidden}
                aria-label={hidden ? 'Mostrar valores' : 'Ocultar valores'}
                className="flex items-center justify-center w-5 h-5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-150"
              >
                {hidden ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground tracking-wide">
              {formatMonth(month)}
            </span>
          </div>

          {/* Balance — hero number */}
          {loading ? (
            <div className="h-14 w-52 animate-pulse rounded bg-muted/30" />
          ) : (
            <div key={month} className="space-y-1.5">
              <p
                className={cn(
                  'text-5xl font-bold tabular-nums tracking-tight leading-none data-boot-anim data-flicker',
                  hidden
                    ? 'tracking-[0.3em] text-muted-foreground'
                    : balance >= 0
                    ? 'text-income income-glow'
                    : 'text-expense expense-glow',
                )}
              >
                {mask(fmt(balance))}
              </p>
              {data?.lastImportDate ? (
                <p className="text-[10px] text-muted-foreground">
                  Atualizado em {fmtDate(data.lastImportDate)}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">Nenhum dado importado</p>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Month strip */}
          <MonthStrip
            months={months12}
            selected={month}
            onSelect={setMonth}
            history={history}
            hidden={hidden}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CONTENT — only when data is available
          ══════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded border border-border bg-card" />
          ))}
        </div>
      ) : data && !data.hasData ? (
        <EmptyState
          title="Nenhum dado importado"
          description="Importe seu primeiro extrato bancário para começar a acompanhar suas finanças."
          action={{ label: 'Importar extrato', href: '/transactions/import' }}
          icon={<Upload className="h-6 w-6" />}
        />
      ) : data ? (
        <>
          {/* Pending classification banner */}
          {data.pendingCount > 0 && (
            <div className="rounded border border-warning/30 bg-warning/8 px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-sm text-warning">
                <strong>{data.pendingCount} transaç{data.pendingCount === 1 ? 'ão' : 'ões'}</strong> aguarda{data.pendingCount === 1 ? '' : 'm'} classificação — KPIs refletem apenas transações classificadas.
              </p>
              <Link href="/transactions" className="text-xs font-bold text-warning whitespace-nowrap hover:underline tracking-wide">
                REVISAR →
              </Link>
            </div>
          )}

          {/* Income + Expenses */}
          <div className="grid grid-cols-2 gap-4">
            <MetricPanel
              label="Receita"
              value={mask(fmt(data.personalIncome))}
              icon={<TrendingUp className="h-3.5 w-3.5" />}
              colorClass="text-income"
              borderClass="border-income/20"
              glowClass="income-glow"
            />
            <MetricPanel
              label="Gastos"
              value={mask(fmt(data.personalExpenses))}
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              colorClass="text-expense"
              borderClass="border-expense/20"
              glowClass="expense-glow"
            />
          </div>

          {/* Invested + Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricPanel
              label="Investido"
              value={mask(fmt(data.invested))}
              icon={<Landmark className="h-3.5 w-3.5" />}
              colorClass="text-investment"
              borderClass="border-investment/20"
              glowClass="invest-glow"
            />

            {/* Budget panel — different layout, keep inline */}
            <div className="rounded border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                    Orçamento
                  </span>
                </div>
                <Link
                  href="/budget"
                  className="text-[9px] font-bold tracking-[0.12em] uppercase text-primary hover:underline"
                >
                  VER →
                </Link>
              </div>
              <ProgressBar
                value={data.budgetPercent}
                showPercent
                variant={
                  data.budgetPercent > 100
                    ? 'danger'
                    : data.budgetPercent > 85
                    ? 'warning'
                    : 'default'
                }
              />
              <p className="text-xs text-muted-foreground tabular-nums">
                {data.budgetPercent.toFixed(0)}% consumido
                {data.budgetTarget > 0 && ` · limite ${mask(fmt(data.budgetTarget))}`}
              </p>
            </div>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="rounded border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-[9px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                  <Bell className="h-3.5 w-3.5 text-warning" />
                  Alertas
                  <span className="inline-flex items-center rounded bg-expense/10 px-1.5 py-0.5 text-[9px] font-bold text-expense">
                    {data.alertsCount}
                  </span>
                </h2>
                {data.alertsCount > 5 && (
                  <Link href="/budget" className="text-[9px] font-bold tracking-[0.12em] uppercase text-primary hover:underline">
                    VER TODOS →
                  </Link>
                )}
              </div>
              <ul className="space-y-2">
                {data.alerts.map((alert) => (
                  <li key={alert.id} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0',
                        alert.severity === 'critical' ? 'bg-expense' : 'bg-warning',
                      )}
                    />
                    <span className="text-muted-foreground">{alert.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expenses donut + Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded border border-border bg-card p-4 space-y-3">
              <h2 className="text-[9px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                Gastos por Categoria
              </h2>
              <ExpensesDonut data={data.expensesChart} totalExpenses={data.personalExpenses} />
            </div>

            {/* Quick actions — Nubank-style horizontal pills */}
            <div className="rounded border border-border bg-card p-4 space-y-4">
              <h2 className="text-[9px] font-bold tracking-[0.18em] uppercase text-muted-foreground">
                Acesso Rápido
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: '/transactions/import', label: 'Importar', icon: Upload, desc: 'Novo extrato' },
                  { href: '/budget', label: 'Orçamento', icon: BarChart3, desc: 'Ver limites' },
                  { href: '/investments', label: 'Investimentos', icon: TrendingUp, desc: 'Portfólio' },
                  { href: '/dreams', label: 'Sonhos', icon: CheckCircle2, desc: 'Metas' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded border border-border p-3 hover:bg-muted/40 hover:border-primary/30 transition-all duration-150 group"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded bg-primary/8 border border-primary/20 text-primary group-hover:bg-primary/15 transition-colors">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
