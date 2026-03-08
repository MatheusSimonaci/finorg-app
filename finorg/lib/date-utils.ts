const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function startOfMonth(month: string): Date {
  const [year, mo] = month.split('-').map(Number)
  return new Date(year, mo - 1, 1)
}

export function endOfMonth(month: string): Date {
  const [year, mo] = month.split('-').map(Number)
  return new Date(year, mo, 0, 23, 59, 59, 999)
}

export function addMonth(month: string, delta: number): string {
  const [year, mo] = month.split('-').map(Number)
  const d = new Date(year, mo - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function formatMonth(month: string): string {
  const [year, mo] = month.split('-').map(Number)
  return `${MONTH_NAMES[mo - 1]} ${year}`
}

export function lastNMonths(n: number, from?: string): string[] {
  const base = from || currentMonth()
  const months: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    months.push(addMonth(base, -i))
  }
  return months
}
