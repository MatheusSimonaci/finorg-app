import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { calculateRequiredMonthlyContribution, calculateProgress, monthsUntil, addMonths } from '@/lib/dreams/calculator'

// GET /api/dreams/active — active (acumulando) dream with accumulation data
export async function GET() {
  const dream = await db.dream.findFirst({
    where: { status: 'acumulando' },
    include: {
      assets: { where: { active: true } },
    },
  })

  if (!dream) return NextResponse.json(null)

  const earmarked = dream.assets.reduce((s, a) => s + Number(a.currentValue), 0)
  const progress = calculateProgress(earmarked, Number(dream.targetAmount))
  const requiredMonthly = dream.targetDate
    ? calculateRequiredMonthlyContribution(Number(dream.targetAmount), earmarked, dream.targetDate)
    : null
  const monthsLeft = dream.targetDate ? monthsUntil(dream.targetDate) : null

  return NextResponse.json({
    ...dream,
    earmarked,
    progress,
    requiredMonthly,
    monthsLeft,
    targetAmount: Number(dream.targetAmount),
  })
}
