// Patrimony projection engine — compound growth, yearly data points

export interface AssetInput {
  value: number
  annualRate: number // e.g. 0.105 for 10.5%
}

export type ProjectionHorizon = 1 | 3 | 5 | 10 | 20

export interface DataPoint {
  month: number
  year: number
  label: string
  nominalWith: number
  nominalWithout: number
  realWith: number
  realWithout: number
}

export interface PatrimonyProjectionParams {
  horizon: ProjectionHorizon
  inflationRate: number // annual, e.g. 0.045
  monthlyContribution: number
  assets: AssetInput[]
}

export interface PatrimonyProjectionResult {
  dataPoints: DataPoint[]
  initialTotal: number
  finalWith: number
  finalWithout: number
  weightedAnnualRate: number
}

export function projectPatrimony(params: PatrimonyProjectionParams): PatrimonyProjectionResult {
  const { horizon, inflationRate, monthlyContribution, assets } = params

  const initialTotal = assets.reduce((s, a) => s + a.value, 0)

  // Weighted average annual rate across all assets
  const weightedAnnualRate =
    initialTotal > 0
      ? assets.reduce((s, a) => s + a.annualRate * (a.value / initialTotal), 0)
      : 0.09

  const monthlyRate = Math.pow(1 + weightedAnnualRate, 1 / 12) - 1
  const monthlyInflation = Math.pow(1 + inflationRate, 1 / 12) - 1
  const totalMonths = horizon * 12
  const startYear = new Date().getFullYear()

  const dataPoints: DataPoint[] = []
  let withVal = initialTotal
  let withoutVal = initialTotal

  for (let m = 0; m <= totalMonths; m++) {
    // Emit yearly data points (and the final month)
    if (m % 12 === 0) {
      const deflator = Math.pow(1 + monthlyInflation, m)
      const year = startYear + m / 12
      dataPoints.push({
        month: m,
        year,
        label: String(year),
        nominalWith: Math.round(withVal),
        nominalWithout: Math.round(withoutVal),
        realWith: Math.round(withVal / deflator),
        realWithout: Math.round(withoutVal / deflator),
      })
    }

    if (m < totalMonths) {
      withVal = withVal * (1 + monthlyRate) + monthlyContribution
      withoutVal = withoutVal * (1 + monthlyRate)
    }
  }

  const last = dataPoints[dataPoints.length - 1]

  return {
    dataPoints,
    initialTotal: Math.round(initialTotal),
    finalWith: last.nominalWith,
    finalWithout: last.nominalWithout,
    weightedAnnualRate,
  }
}
