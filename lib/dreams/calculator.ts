// Pure calculation functions for the Dreams module

export function monthsUntil(targetDate: Date): number {
  const now = new Date()
  return (
    (targetDate.getFullYear() - now.getFullYear()) * 12 +
    (targetDate.getMonth() - now.getMonth())
  )
}

export function calculateRequiredMonthlyContribution(
  targetAmount: number,
  earmarked: number,
  targetDate: Date
): number {
  const remaining = targetAmount - earmarked
  if (remaining <= 0) return 0
  const months = monthsUntil(targetDate)
  if (months <= 0) return remaining
  return remaining / months
}

export function calculateMonthsToGoal(
  targetAmount: number,
  earmarked: number,
  monthlyContribution: number
): number {
  const remaining = targetAmount - earmarked
  if (remaining <= 0) return 0
  if (monthlyContribution <= 0) return Infinity
  return Math.ceil(remaining / monthlyContribution)
}

export function calculateProgress(earmarked: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0
  return Math.min(100, (earmarked / targetAmount) * 100)
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}
