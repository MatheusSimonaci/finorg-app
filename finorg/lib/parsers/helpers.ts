/** Normalizes a string key for case/diacritics-insensitive matching */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

/** Get a row value by any of the provided key candidates (case+diacritics-insensitive) */
export function get(row: Record<string, string>, ...keys: string[]): string {
  const map = new Map<string, string>()
  for (const [k, v] of Object.entries(row)) {
    map.set(normalize(k), v)
  }
  for (const key of keys) {
    const val = map.get(normalize(key))
    if (val !== undefined) return val
  }
  return ""
}

export function parseDate(value: string): Date {
  if (!value || value.trim() === "") throw new Error("Data vazia")
  const v = value.trim()
  // ISO 8601: 2026-03-01
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) {
    const d = new Date(v.slice(0, 10) + "T12:00:00Z")
    if (!isNaN(d.getTime())) return d
  }
  // BR: 01/03/2026
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [d, m, y] = v.split("/")
    return new Date(`${y}-${m}-${d}T12:00:00Z`)
  }
  // BR short: 01/03/26
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(v)) {
    const [d, m, y] = v.split("/")
    return new Date(`20${y}-${m}-${d}T12:00:00Z`)
  }
  throw new Error(`Formato de data não reconhecido: ${value}`)
}

export function parseAmount(value: string | undefined): number {
  if (!value || value.trim() === "") return 0
  let clean = value.replace(/[R$\s]/g, "").trim()
  // BR format: 1.234,56 → 1234.56
  if (/\d,\d{2}$/.test(clean)) {
    clean = clean.replace(/\./g, "").replace(",", ".")
  }
  const num = parseFloat(clean)
  if (isNaN(num)) throw new Error(`Valor inválido: ${value}`)
  return num
}
