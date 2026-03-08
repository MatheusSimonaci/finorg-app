import * as XLSX from 'xlsx'
import { parseAmount } from './helpers'

// ─── Section name → Asset type ───────────────────────────────────────────────
const SECTION_MAP: [string, string][] = [
  ['fundosimobiliarios', 'fii'],
  ['acoes', 'acoes'],
  ['tesourodireto', 'tesouro'],
  ['cdb', 'cdb'],
  ['lcilca', 'lci'],
  ['lci', 'lci'],
  ['lca', 'lci'],
  ['previdencia', 'previdencia'],
  ['fundosdeinvestimento', 'fundo'],
  ['funcos', 'fundo'], // typo-proof
  ['custodiaremunerada', 'conta_remunerada'],
  ['criptomoedas', 'cripto'],
  ['cripto', 'cripto'],
  ['acoesbdr', 'acoes'],
  ['etf', 'acoes'],
  ['fundoslistados', 'fii'],
]

// Sections that contain income info (dividends), NOT positions — should be skipped
const SKIP_PREFIXES = ['dividendo', 'provento', 'outrasdistribuicoes', 'posicaodefundos']

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function parseMoneyCell(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    try {
      return parseAmount(v)
    } catch {
      return 0
    }
  }
  return 0
}

function parsePctCell(v: unknown): number {
  if (typeof v === 'number') return v * 100 // xlsx may return 0.4318 for 43.18%
  if (typeof v === 'string') {
    const clean = v.replace('%', '').replace(',', '.').trim()
    return parseFloat(clean) || 0
  }
  return 0
}

function mapSection(normFirst: string): string | null {
  // Exact match first
  for (const [key, type] of SECTION_MAP) {
    if (normFirst === key) return type
  }
  // Prefix match (e.g. "posicaofundosimobiliarios")
  for (const [key, type] of SECTION_MAP) {
    if (normFirst.includes(key)) return type
  }
  return null
}

function isSkipSection(normFirst: string): boolean {
  return SKIP_PREFIXES.some((prefix) => normFirst.startsWith(prefix) || normFirst.includes(prefix))
}

function extractDate(row0: unknown[]): string {
  // Col 5: "Conta: 11954876 | 08/03/2026, 15:20"
  //     or "Conta: 11954876 | Data da consulta: 08/03/2026 | Data da Posição Histórica: 28/02/2026"
  const cell = String(row0[5] ?? row0[0] ?? '')

  // Prefer "Posição Histórica: DD/MM/YYYY"
  const histMatch = cell.match(/hist[oó]rica[:\s]+(\d{2}\/\d{2}\/\d{4})/i)
  if (histMatch) {
    const [d, m, y] = histMatch[1].split('/')
    return `${y}-${m}-${d}`
  }

  // Fall back to first DD/MM/YYYY in the cell
  const dateMatch = cell.match(/(\d{2}\/\d{2}\/\d{4})/)
  if (dateMatch) {
    const [d, m, y] = dateMatch[1].split('/')
    return `${y}-${m}-${d}`
  }

  return new Date().toISOString().slice(0, 10)
}

// ─── Public types ─────────────────────────────────────────────────────────────

export type XPPortfolioAsset = {
  name: string
  type: string
  currentValue: number
  lastPrice: number
  quantity: number
  allocationPct: number
}

export type XPPortfolioResult = {
  snapshotDate: string // YYYY-MM-DD
  month: string // YYYY-MM
  totalInvested: number
  assets: XPPortfolioAsset[]
  parseErrors: string[]
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseXPPortfolioBuffer(buffer: Buffer): XPPortfolioResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false, // get formatted strings so R$ values come through as-is
  })

  const parseErrors: string[] = []
  const assets: XPPortfolioAsset[] = []

  if (rows.length < 4) {
    return { snapshotDate: new Date().toISOString().slice(0, 10), month: new Date().toISOString().slice(0, 7), totalInvested: 0, assets, parseErrors: ['Arquivo muito curto ou formato inesperado.'] }
  }

  const snapshotDate = extractDate(rows[0] as unknown[])
  const month = snapshotDate.slice(0, 7)

  // Row 3 col 0: "R$ 1.022,69" = total investido
  const totalInvested = parseMoneyCell((rows[3] as unknown[])[0])

  // State machine
  let currentType: string | null = null
  let inDataRows = false

  for (let i = 4; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const firstCell = String(row[0] ?? '').trim()

    // Blank / spacer rows
    if (!firstCell || firstCell === ' ' || firstCell === '-') continue

    const norm = normalizeKey(firstCell)

    // Detect skip section (dividends, proventos, etc.) — once reached, stop processing.
    // XP format: position sections always precede dividends/proventos sections.
    if (isSkipSection(norm)) break

    // Section header row: known asset type, no data yet in this section
    const mapped = mapSection(norm)
    if (mapped && !inDataRows) {
      currentType = mapped
      inDataRows = false
      continue
    }

    if (!currentType) continue

    // Column sub-header row: "X% | ..." pattern signals start of data.
    // Only set inData if 2nd col is "Posição" (position data), not "Provisionado" (dividends).
    if (firstCell.includes('%') && firstCell.includes('|')) {
      const secondCol = normalizeKey(String(row[1] ?? ''))
      if (secondCol.startsWith('posicao') || secondCol === '') {
        inDataRows = true
      }
      continue
    }

    if (!inDataRows) continue

    // Data row: [ticker/name, value, % alocação, rentabilidade, preço médio, última cotação, qtd, cotas]
    const name = firstCell
    const currentValue = parseMoneyCell(row[1])
    const allocationPct = parsePctCell(row[2])
    const lastPrice = parseMoneyCell(row[5])
    const quantity = parseMoneyCell(row[6])

    if (!name || currentValue === 0) continue

    assets.push({ name, type: currentType, currentValue, lastPrice, quantity, allocationPct })
  }

  return { snapshotDate, month, totalInvested, assets, parseErrors }
}
