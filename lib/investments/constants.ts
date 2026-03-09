// ─── Asset type metadata ───────────────────────────────────────────────────

export const ASSET_TYPES = {
  tesouro:          { label: 'Tesouro Direto',       color: '#60a5fa', subtypes: ['Selic', 'IPCA+', 'Prefixado'] },
  cdb:              { label: 'CDB',                  color: '#34d399', subtypes: ['CDI', 'IPCA', 'Prefixado'] },
  lci_lca:          { label: 'LCI / LCA',            color: '#a3e635', subtypes: ['LCI', 'LCA'] },
  fii:              { label: 'FII',                  color: '#fbbf24', subtypes: [] },
  acoes:            { label: 'Ações',                color: '#a78bfa', subtypes: [] },
  cripto:           { label: 'Cripto',               color: '#f97316', subtypes: ['BTC', 'ETH', 'Outros'] },
  previdencia:      { label: 'Previdência',          color: '#e879f9', subtypes: ['PGBL', 'VGBL'] },
  fundo:            { label: 'Fundo',                color: '#22d3ee', subtypes: ['Multimercado', 'Renda Fixa', 'Ações'] },
  conta_remunerada: { label: 'Conta Remunerada',     color: '#94a3b8', subtypes: [] },
} as const

export type AssetType = keyof typeof ASSET_TYPES

export const ASSET_TYPE_LIST = Object.keys(ASSET_TYPES) as AssetType[]

export function assetLabel(type: string): string {
  return ASSET_TYPES[type as AssetType]?.label ?? type
}

export function assetColor(type: string): string {
  return ASSET_TYPES[type as AssetType]?.color ?? '#94a3b8'
}

export function assetSubtypes(type: string): string[] {
  return [...(ASSET_TYPES[type as AssetType]?.subtypes ?? [])]
}

// ─── Purpose / Finalidade ──────────────────────────────────────────────────

export const ASSET_PURPOSES = {
  personal:  { label: 'Renda Passiva Pessoal', badge: 'investment' as const },
  business:  { label: 'Empresarial',           badge: 'muted' as const },
  reserve:   { label: 'Reserva de Emergência', badge: 'reserve' as const },
  dream:     { label: 'Sonho Específico',      badge: 'warning' as const },
} as const

export type AssetPurpose = keyof typeof ASSET_PURPOSES

// ─── Portfolio state ────────────────────────────────────────────────────────

export type PortfolioState = 'EQUILIBRADA' | 'SOB_SONHO' | 'REBALANCEANDO'

// ─── Moderate default template ──────────────────────────────────────────────

export const MODERATE_TEMPLATE: Record<AssetType, number> = {
  tesouro:          20,
  cdb:              20,
  lci_lca:          10,
  fii:              15,
  acoes:            20,
  cripto:            5,
  previdencia:       5,
  fundo:             0,
  conta_remunerada:  5,
}
