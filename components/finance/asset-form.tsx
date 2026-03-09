'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ASSET_TYPES, ASSET_TYPE_LIST, ASSET_PURPOSES, assetSubtypes } from '@/lib/investments/constants'
import type { AssetType, AssetPurpose } from '@/lib/investments/constants'
import { isLowLiquidity, isSuggestedReserveAsset } from '@/lib/investments/liquidity-validator'
import { cn } from '@/lib/utils'

export interface AssetFormData {
  name: string
  type: AssetType
  subtype: string | null
  institution: string
  currentValue: number
  purpose: AssetPurpose
}

interface AssetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<AssetFormData>
  onSave: (data: AssetFormData) => Promise<void>
}

const INSTITUTIONS = ['Nubank', 'XP', 'Bitybank', 'Rico', 'Inter', 'C6', 'BTG', 'Outro']

const EMPTY: AssetFormData = {
  name: '',
  type: 'tesouro',
  subtype: null,
  institution: '',
  currentValue: 0,
  purpose: 'personal',
}

function Field({ label, error, children, className }: {
  label: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-expense">{error}</p>}
    </div>
  )
}

export function AssetForm({ open, onOpenChange, initialData, onSave }: AssetFormProps) {
  const [form, setForm] = useState<AssetFormData>({ ...EMPTY, ...initialData })
  const [errors, setErrors] = useState<Partial<Record<keyof AssetFormData, string>>>({})
  const [saving, setSaving] = useState(false)

  const showLowLiquidityWarning = form.purpose === 'reserve' && isLowLiquidity(form.type)
  const showReserveSuggestion = form.purpose !== 'reserve' && isSuggestedReserveAsset(form.name, form.type)

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...initialData })
      setErrors({})
    }
  }, [open, initialData])

  // Clear subtype when type changes
  function setType(type: AssetType) {
    setForm((f) => ({ ...f, type, subtype: null }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof AssetFormData, string>> = {}
    if (!form.name.trim()) errs.name = 'Nome é obrigatório'
    if (!form.institution.trim()) errs.institution = 'Instituição é obrigatória'
    if (form.currentValue < 0) errs.currentValue = 'Valor não pode ser negativo'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const subtypes = assetSubtypes(form.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar ativo' : 'Novo ativo'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Name */}
          <Field label="Nome do ativo" error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Tesouro Selic 2029"
              className={cn(errors.name && 'border-expense')}
            />
          </Field>

          {/* Type + Subtype */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={form.type} onValueChange={(v) => setType(v as AssetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TYPE_LIST.map((t) => (
                    <SelectItem key={t} value={t}>
                      {ASSET_TYPES[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Subtipo">
              {subtypes.length > 0 ? (
                <Select
                  value={form.subtype}
                  onValueChange={(v) => setForm((f) => ({ ...f, subtype: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {subtypes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input disabled placeholder="—" className="opacity-40" />
              )}
            </Field>
          </div>

          {/* Institution + Purpose */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instituição" error={errors.institution}>
              <Select
                value={form.institution}
                onValueChange={(v) => setForm((f) => ({ ...f, institution: v ?? '' }))}
              >
                <SelectTrigger className={cn(errors.institution && 'border-expense')}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTIONS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Finalidade">
              <Select
                value={form.purpose}
                onValueChange={(v) => setForm((f) => ({ ...f, purpose: v as AssetPurpose }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_PURPOSES).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Liquidity warning */}
          {showLowLiquidityWarning && (
            <div className="rounded-lg border border-amber-400/40 bg-amber-50/60 dark:bg-amber-900/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              ⚠️ Ativos de renda variável (ações, FIIs, cripto) não são ideais para reserva de emergência — o valor pode oscilar na hora que você precisar resgatar.
            </div>
          )}

          {/* Reserve suggestion */}
          {showReserveSuggestion && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <p className="text-xs text-primary">
                💡 Este ativo parece ser uma reserva de emergência. Deseja marcá-lo como tal?
              </p>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, purpose: 'reserve' }))}
                className="text-xs font-medium text-primary whitespace-nowrap hover:underline"
              >
                Marcar
              </button>
            </div>
          )}

          {/* Current value */}
          <Field label="Valor atual (R$)" error={errors.currentValue}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.currentValue || ''}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currentValue: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0,00"
                className={cn('pl-8 font-mono tabular-nums', errors.currentValue && 'border-expense')}
              />
            </div>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {initialData ? 'Salvar alterações' : 'Adicionar ativo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
