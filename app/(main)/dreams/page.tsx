'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DreamCard, type DreamCardData } from '@/components/finance/dream-card'
import { DreamForm } from '@/components/finance/dream-form'
import { RealizeDreamModal } from '@/components/finance/realize-dream-modal'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { calculateProgress, calculateRequiredMonthlyContribution, monthsUntil } from '@/lib/dreams/calculator'

type RawDream = {
  id: string
  name: string
  targetAmount: string | number
  targetDate: string | null
  priorityOrder: number
  status: 'planejando' | 'acumulando' | 'realizado' | 'arquivado'
  achievedAt: string | null
  archivedAt: string | null
  notes: string | null
  createdAt: string
  assets: Array<{ id: string; name: string; type: string; currentValue: string | number }>
}

function toDreamCard(d: RawDream): DreamCardData {
  const targetAmount = Number(d.targetAmount)
  const earmarked = (d.assets ?? []).reduce((s, a) => s + Number(a.currentValue), 0)
  const progress = calculateProgress(earmarked, targetAmount)
  const requiredMonthly = d.targetDate
    ? calculateRequiredMonthlyContribution(targetAmount, earmarked, new Date(d.targetDate))
    : null
  const monthsLeft = d.targetDate ? monthsUntil(new Date(d.targetDate)) : null
  return { ...d, targetAmount, earmarked, progress, requiredMonthly, monthsLeft }
}

export default function DreamsPage() {
  const [dreams, setDreams] = useState<DreamCardData[]>([])
  const [assets, setAssets] = useState<Array<{ id: string; name: string; type: string; currentValue: number }>>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DreamCardData | null>(null)
  const [realizing, setRealizing] = useState<DreamCardData | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [dr, as] = await Promise.all([fetch('/api/dreams').then((r) => r.json()), fetch('/api/assets').then((r) => r.json())])
      setDreams((dr as RawDream[]).map(toDreamCard))
      const rawAssets = Array.isArray(as) ? as : as.assets ?? []
      setAssets(rawAssets.map((a: { id: string; name: string; type: string; currentValue: string | number }) => ({ ...a, currentValue: Number(a.currentValue) })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleArchive(id: string) {
    await fetch(`/api/dreams/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = dreams.findIndex((d) => d.id === active.id)
    const newIndex = dreams.findIndex((d) => d.id === over.id)
    const reordered = [...dreams]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    setDreams(reordered) // optimistic

    await fetch('/api/dreams/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((d) => d.id) }),
    })
    load()
  }

  const active = dreams.filter((d) => d.status === 'acumulando' || d.status === 'planejando')
  const realized = dreams.filter((d) => d.status === 'realizado')
  const archived = dreams.filter((d) => d.status === 'arquivado')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sonhos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Metas financeiras, progresso e prazo estimado</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true) }} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo sonho
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Carregando…</div>
      ) : dreams.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-border bg-muted/20">
          <span className="text-4xl mb-4">🌟</span>
          <h3 className="text-base font-semibold text-foreground mb-1.5">Nenhum sonho cadastrado</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-5">
            Comece criando seu primeiro sonho financeiro — viagem, carro, imóvel ou o que você quiser conquistar.
          </p>
          <Button onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Criar primeiro sonho
          </Button>
        </div>
      ) : (
        <>
          {/* Active dreams (drag-and-drop) */}
          {active.length > 0 && (
            <section>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                Ativos · {active.length} sonho{active.length !== 1 ? 's' : ''} · arraste para reordenar
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={active.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {active.map((d) => (
                      <DreamCard
                        key={d.id}
                        dream={d}
                        onEdit={(x) => { setEditing(x); setShowForm(true) }}
                        onArchive={handleArchive}
                        onRealize={setRealizing}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </section>
          )}

          {/* Realized dreams */}
          {realized.length > 0 && (
            <section>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-yellow-500" /> Realizados · {realized.length}
              </p>
              <div className="space-y-3">
                {realized.map((d) => (
                  <DreamCard
                    key={d.id}
                    dream={d}
                    onEdit={() => {}}
                    onArchive={() => {}}
                    onRealize={() => {}}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Archived dreams */}
          {archived.length > 0 && (
            <section>
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">
                Arquivados · {archived.length}
              </p>
              <div className="space-y-3">
                {archived.map((d) => (
                  <DreamCard
                    key={d.id}
                    dream={d}
                    onEdit={() => {}}
                    onArchive={() => {}}
                    onRealize={() => {}}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Modals */}
      <DreamForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null) }}
        onSaved={load}
        initial={editing ? {
          id: editing.id,
          name: editing.name,
          targetAmount: editing.targetAmount,
          targetDate: editing.targetDate,
          priorityOrder: editing.priorityOrder,
          notes: editing.notes,
        } : null}
      />

      {realizing && (
        <RealizeDreamModal
          dream={realizing}
          assets={assets}
          onClose={() => setRealizing(null)}
          onRealized={(_id) => { setRealizing(null); load() }}
        />
      )}
    </div>
  )
}
