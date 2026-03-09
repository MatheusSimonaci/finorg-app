export const BUDGET_CATEGORIES = [
  'moradia',
  'alimentacao',
  'transporte',
  'saude',
  'educacao',
  'lazer',
  'assinaturas',
  'doacao',
  'pet',
  'servicos',
  'outros',
] as const

export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<string, string> = {
  moradia: 'Moradia',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  assinaturas: 'Assinaturas',
  pet: 'Pet',
  doacao: 'Doações & Dízimo',
  servicos: 'Serviços',
  outros: 'Outros',
}

export const CATEGORY_COLORS: Record<string, string> = {
  moradia: '#6366f1',
  alimentacao: '#f59e0b',
  transporte: '#10b981',
  saude: '#ef4444',
  educacao: '#8b5cf6',
  lazer: '#ec4899',
  assinaturas: '#14b8a6',
  pet: '#f97316',
  doacao: '#f59e55',
  servicos: '#84cc16',
  outros: '#94a3b8',
}

export const TEMPLATE_50_30_20 = [
  { category: 'moradia',     targetPct: 28, alertThresholdPct: 80 },
  { category: 'alimentacao', targetPct: 15, alertThresholdPct: 80 },
  { category: 'transporte',  targetPct: 10, alertThresholdPct: 80 },
  { category: 'saude',       targetPct: 5,  alertThresholdPct: 80 },
  { category: 'educacao',    targetPct: 5,  alertThresholdPct: 80 },
  { category: 'lazer',       targetPct: 10, alertThresholdPct: 80 },
  { category: 'assinaturas', targetPct: 5,  alertThresholdPct: 80 },
  { category: 'pet',         targetPct: 2,  alertThresholdPct: 80 },
  { category: 'doacao',      targetPct: 10, alertThresholdPct: 80 },
  { category: 'servicos',    targetPct: 5,  alertThresholdPct: 80 },
  { category: 'outros',      targetPct: 5,  alertThresholdPct: 80 },
]
