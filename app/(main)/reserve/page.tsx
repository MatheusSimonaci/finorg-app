'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/finance/empty-state'
import { ReserveProgress } from '@/components/finance/reserve-progress'
import { formatCurrency } from '@/lib/utils'
import type { ReserveStatus } from '@/lib/reserve/calculator'

type Asset = {
  id: string
  name: string
  type: string
  institution: string
  currentValue: number
  pct: number
}

type StatusData = {
  currentValue: number
  targetValue: number
  targetMonths: number
  monthlyAvg: number
  coverageMonths: number
  status: ReserveStatus
  monthlyContributionNeeded: number
  assets: Asset[]
  lastUpdated: string | null
  hasData: boolean
  config: {
    targetMonths: number
    calculationWindowMonths: number
    excludeOutliers: boolean
  }
}

const TYPE_LABEL: Record<string, string> = {
  tesouro: 'Tesouro',
  cdb: 'CDB',
  conta_remunerada: 'Conta Remunerada',
  lci_lca: 'LCI/LCA',
  fii: 'FII',
  acoes: 'Ações',
  cripto: 'Cripto',
  previdencia: 'Previdência',
  fundo: 'Fundo',
  internacional: 'Internacional',
  outros: 'Outros',
}

export default function ReservePage() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true)
    try {
      const res = await fetch('/api/reserve/status')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex-1 p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-48 bg-muted rounded-xl" />
        <div className="h-32 bg-muted rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex-1 p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reserva de Emergência</h1>
          {data.lastUpdated && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Atualizado em {new Date(data.lastUpdated).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => load(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Link href="/reserve/settings">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Configurar meta
            </Button>
          </Link>
        </div>
      </div>

      {/* Monthly avg info */}
      {data.hasData && data.monthlyAvg > 0 && (
        <p className="text-sm text-muted-foreground">
          Gasto médio <strong>{formatCurrency(data.monthlyAvg)}/mês</strong> nos últimos{' '}
          {data.config.calculationWindowMonths} meses →{' '}
          meta de <strong>{data.config.targetMonths} meses</strong> = <strong>{formatCurrency(data.targetValue)}</strong>
        </p>
      )}

      {/* Progress widget */}
      {data.hasData ? (
        <ReserveProgress
          currentValue={data.currentValue}
          targetValue={data.targetValue}
          coverageMonths={data.coverageMonths}
          targetMonths={data.targetMonths}
          status={data.status}
          monthlyContributionNeeded={data.monthlyContributionNeeded}
        />
      ) : (
        <div className="rounded-xl border p-6 bg-muted/20 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Não há dados suficientes para calcular a meta. Configure o período de cálculo ou adicione transações.
          </p>
          <Link href="/reserve/settings">
            <Button variant="outline" size="sm">Configurar</Button>
          </Link>
        </div>
      )}

      {/* Asset list */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Ativos designados ({data.assets.length})
        </h2>

        {data.assets.length === 0 ? (
          <EmptyState
            title="Nenhum ativo designado"
            description="Marque ativos como finalidade 'Reserva de Emergência' em Investimentos para que apareçam aqui."
            action={{ label: 'Ver investimentos', href: '/investments' }}
          />
        ) : (
          <div className="rounded-xl border divide-y overflow-hidden">
            {data.assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABEL[a.type] ?? a.type} · {a.institution}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 pl-4">
                  <p className="text-sm font-mono font-semibold">{formatCurrency(a.currentValue)}</p>
                  <p className="text-xs text-muted-foreground">{a.pct.toFixed(1)}% da reserva</p>
                </div>
              </div>
            ))}

            {/* Total row */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/40">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-sm font-mono font-bold">{formatCurrency(data.currentValue)}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
