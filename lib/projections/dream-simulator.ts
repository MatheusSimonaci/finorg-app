// Dream simulator — given a dream cost gap and monthly contribution, calculate months to goal
// across 3 rate scenarios: conservative, current, accelerated

export type Scenario = 'conservative' | 'current' | 'accelerated'

export interface SimulationResult {
  scenario: Scenario
  monthsToGoal: number
  estimatedDate: Date
  rateUsed: number // annual rate e.g. 0.105
  pastTargetDate: boolean
}

export interface DreamSimulatorParams {
  currentProgress: number // current saved amount toward the dream
  targetAmount: number
  monthlyContribution: number // monthly addition dedicated to this dream
  baseAnnualRate: number // weighted rate from allocated assets (or default)
  targetDate?: Date // AC5: badge if past this date
}

/** Simulate months to goal using compound growth + flat contribution */
function monthsToGoal(pv: number, target: number, C: number, monthlyRate: number): number {
  if (target <= pv) return 0
  if (C <= 0 && monthlyRate <= 0) return 600 // ~50 years cap

  let value = pv
  for (let m = 1; m <= 600; m++) {
    value = value * (1 + monthlyRate) + C
    if (value >= target) return m
  }
  return 600
}

function addMonths(from: Date, months: number): Date {
  const d = new Date(from)
  d.setMonth(d.getMonth() + months)
  return d
}

export function simulateDream(params: DreamSimulatorParams): SimulationResult[] {
  const { currentProgress, targetAmount, monthlyContribution, baseAnnualRate, targetDate } = params

  const scenarios: { scenario: Scenario; annualRate: number }[] = [
    { scenario: 'conservative', annualRate: baseAnnualRate * 0.7 },
    { scenario: 'current', annualRate: baseAnnualRate },
    { scenario: 'accelerated', annualRate: baseAnnualRate * 1.3 },
  ]

  const now = new Date()

  return scenarios.map(({ scenario, annualRate }) => {
    const monthlyRate = Math.pow(1 + Math.max(0, annualRate), 1 / 12) - 1
    const months = monthsToGoal(currentProgress, targetAmount, monthlyContribution, monthlyRate)
    const estimatedDate = addMonths(now, months)

    return {
      scenario,
      monthsToGoal: months,
      estimatedDate,
      rateUsed: annualRate,
      pastTargetDate: targetDate ? estimatedDate > targetDate : false,
    }
  })
}
