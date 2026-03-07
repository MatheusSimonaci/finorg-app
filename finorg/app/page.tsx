import Link from 'next/link'
import {
  BarChart3,
  Bell,
  CheckCircle2,
  TrendingUp,
  Upload,
  Wallet,
} from 'lucide-react'
import { KpiCard } from '@/components/finance/kpi-card'
import { EmptyState } from '@/components/finance/empty-state'
import { ProgressBar } from '@/components/ui/progress-bar'

// TODO Story 2.1 T1: replace with GET /api/dashboard?month=YYYY-MM
// and remove the `as` cast once the route exists.
type DashboardData = {
  income: number
  expenses: number
  invested: number
  balance: number
  budgetPercent: number
  lastImport: string
  alerts: Array<{ id: string; message: string; severity: 'warning' | 'critical' }>
}

export default function DashboardPage() {
  const data = null as DashboardData | null

  return (
    <div className="p-6 space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `Última atualização: ${data.lastImport}` : 'Nenhum dado importado ainda'}
          </p>
        </div>
        {/* Month navigation — Story 2.1 AC5 */}
        <div className="flex items-center gap-1 text-sm self-start sm:self-auto">
          <button className="px-2 py-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            ‹
          </button>
          <span className="px-3 py-1.5 rounded-md bg-muted text-foreground font-medium min-w-[110px] text-center tabular-nums">
            Março 2026
          </span>
          <button className="px-2 py-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            ›
          </button>
        </div>
      </div>

      {data ? (
        <>
          {/* KPI Grid — Story 2.1 AC1 */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Receita pessoal"
              value={data.income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              icon={<TrendingUp className="h-4 w-4" />}
              variant="income"
            />
            <KpiCard
              label="Gastos pessoais"
              value={data.expenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              icon={<Wallet className="h-4 w-4" />}
              variant="expense"
            />
            <KpiCard
              label="Investido"
              value={data.invested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              icon={<BarChart3 className="h-4 w-4" />}
              variant="investment"
            />
            <KpiCard
              label="Saldo líquido"
              value={data.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              icon={<CheckCircle2 className="h-4 w-4" />}
              variant={data.balance >= 0 ? 'income' : 'expense'}
            />
          </div>

          {/* Budget progress — Story 2.1 AC2 */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Orçamento pessoal</h2>
              <Link href="/budget" className="text-xs text-primary hover:underline">
                Ver detalhes →
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
            <p className="text-xs text-muted-foreground">
              {data.budgetPercent.toFixed(0)}% do orçamento mensal consumido
            </p>
          </div>

          {/* Alerts — Story 2.1 AC3 */}
          {data.alerts.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-warning" />
                Alertas ativos
              </h2>
              <ul className="space-y-2">
                {data.alerts.slice(0, 5).map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-start gap-2.5 text-sm text-muted-foreground"
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                        alert.severity === 'critical' ? 'bg-expense' : 'bg-warning'
                      }`}
                    />
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title="Nenhum dado importado"
          description="Importe seu primeiro extrato bancário para começar a acompanhar suas finanças."
          action={{ label: 'Importar extrato', href: '/transactions' }}
          icon={<Upload className="h-6 w-6" />}
        />
      )}
    </div>
  )
}
