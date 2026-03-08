'use client'

import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type ActiveDream = {
  id: string
  name: string
  targetAmount: number
  earmarked: number
  progress: number
  requiredMonthly: number | null
  monthsLeft: number | null
}

export function DreamModeBanner() {
  const [dream, setDream] = useState<ActiveDream | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/dreams/active')
      .then((r) => r.json())
      .then((d) => setDream(d))
      .catch(() => null)
  }, [])

  if (!dream || dismissed) return null

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
        title="Dispensar"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <div className="flex-1 pr-5">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Sonho ativo: {dream.name}
          </p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            Alocação recomendada ajustada para maximizar liquidez
            {dream.requiredMonthly !== null && dream.requiredMonthly > 0 && (
              <> · Reserve <strong>{formatCurrency(dream.requiredMonthly)}/mês</strong> em ativos líquidos</>
            )}
          </p>

          <div className="mt-2">
            <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-1">
              <span>{formatCurrency(dream.earmarked)} de {formatCurrency(dream.targetAmount)}</span>
              <span className="font-medium">{dream.progress.toFixed(1)}%</span>
            </div>
            <ProgressBar value={dream.progress} className="h-1.5" />
          </div>

          <Link
            href={`/dreams/${dream.id}`}
            className="inline-block mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Ver painel do sonho →
          </Link>
        </div>
      </div>
    </div>
  )
}
