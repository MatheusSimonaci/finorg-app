// Liquidity classification for asset types

export const LOW_LIQUIDITY_TYPES = new Set(['fii', 'acoes', 'cripto', 'previdencia'])
export const HIGH_LIQUIDITY_TYPES = new Set(['conta_remunerada', 'tesouro', 'cdb'])

export function isLowLiquidity(assetType: string): boolean {
  return LOW_LIQUIDITY_TYPES.has(assetType)
}

export function isHighLiquidity(assetType: string): boolean {
  return HIGH_LIQUIDITY_TYPES.has(assetType)
}

const RESERVE_NAME_PATTERNS = [
  /nubank.*reserva/i,
  /reserva.*nubank/i,
  /tesouro.*selic/i,
  /selic/i,
  /cdb.*liquidez.*(di[aá]ria|imediata)/i,
  /liquidez.*(di[aá]ria|imediata)/i,
  /conta.*remunerada/i,
  /rendimento.*di[aá]rio/i,
]

export function isSuggestedReserveAsset(name: string, type: string): boolean {
  if (RESERVE_NAME_PATTERNS.some((p) => p.test(name))) return true
  if (type === 'conta_remunerada') return true
  return false
}
