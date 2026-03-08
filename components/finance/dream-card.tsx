'use client'

import { useState } from 'react'
import { GripVertical, Edit2, Archive, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ProgressBar } from '@/components/ui/progress-bar'
import { calculateProgress } from '@/lib/dreams/calculator'

export type DreamStatus = 'planejando' | 'acumulando' | 'realizado' | 'arquivado'

export type DreamCardData = {
  id: string
  name: string
  targetAmount: number
  targetDate: string | null
  priorityOrder: number
  status: DreamStatus
  achievedAt: string | null
  notes: string | null
  earmarked: number
  progress: number
  requiredMonthly: number | null
  monthsLeft: number | null
}

type Props = {
  dream: DreamCardData
  onEdit: (dream: DreamCardData) => void
  onArchive: (id: string) => void
  onRealize: (dream: DreamCardData) => void
  isDragging?: boolean
}

const STATUS_CONFIG: Record<DreamStatus, { label: string; className: string }> = {
  planejando: { label: '📝 PLANEJANDO', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  acumulando: { label: '💰 ACUMULANDO', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  realizado: { label: '🏆 REALIZADO', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  arquivado: { label: '🗄️ ARQUIVADO', className: 'bg-muted text-muted-foreground' },
}

export function DreamCard({ dream, onEdit, onArchive, onRealize, isDragging }: Props) {
  const [showNotes, setShowNotes] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: dream.id })

  const style = { transform: CSS.Transform.toString(transform), transition }
  const isActive = dream.status === 'acumulando'
  const isRealized = dream.status === 'realizado'
  const isArchived = dream.status === 'arquivado'
  const cfg = STATUS_CONFIG[dream.status]
  const canRealize = dream.progress >= 90 && !isRealized && !isArchived

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-xl border border-border bg-card p-4 transition-shadow',
        isActive && 'ring-2 ring-primary/30 bg-primary/5',
        isDragging && 'opacity-60 shadow-xl',
        isArchived && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        {!isRealized && !isArchived && (
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={cn('text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full', cfg.className)}>
              {cfg.label}
            </span>
            {!isRealized && !isArchived && (
              <div className="flex items-center gap-1">
                <button onClick={() => onEdit(dream)} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors" title="Editar">
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onArchive(dream.id)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors" title="Arquivar">
                  <Archive className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <h3 className="font-semibold text-foreground truncate">{dream.name}</h3>

          {/* Target + date */}
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-lg font-bold font-mono text-foreground">{formatCurrency(dream.targetAmount)}</span>
            {dream.targetDate && (
              <span className="text-xs text-muted-foreground">até {new Date(dream.targetDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
            )}
          </div>

          {/* Progress */}
          {!isArchived && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{formatCurrency(dream.earmarked)} reservados</span>
                <span>{dream.progress.toFixed(1)}%</span>
              </div>
              <ProgressBar value={dream.progress} className={isActive ? 'h-2' : 'h-1.5'} />
            </div>
          )}

          {/* Monthly contribution hint (active only) */}
          {isActive && dream.requiredMonthly !== null && dream.requiredMonthly > 0 && (
            <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Reserve <span className="font-bold">{formatCurrency(dream.requiredMonthly)}/mês</span>
              {dream.monthsLeft !== null && dream.monthsLeft > 0 && (
                <span className="text-muted-foreground font-normal"> · {dream.monthsLeft} meses restantes</span>
              )}
            </p>
          )}

          {/* Realized date */}
          {isRealized && dream.achievedAt && (
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">🎉 Realizado em {formatDate(dream.achievedAt)}</p>
          )}

          {/* Notes toggle */}
          {dream.notes && (
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showNotes ? 'Ocultar obs.' : 'Ver obs.'}
            </button>
          )}
          {showNotes && dream.notes && (
            <p className="mt-1 text-xs text-muted-foreground bg-muted/40 rounded-md p-2">{dream.notes}</p>
          )}

          {/* Realize button */}
          {canRealize && (
            <button
              onClick={() => onRealize(dream)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-white font-medium text-sm py-1.5 transition-colors"
            >
              <Trophy className="h-3.5 w-3.5" />
              Realizar sonho 🏆
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
