import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

// PATCH /api/dreams/[id]/realize
// Body: { withdrawals: { assetId: string, amount: number }[], notes?: string }
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { withdrawals, notes } = await req.json()

  if (!Array.isArray(withdrawals) || withdrawals.length === 0) {
    return NextResponse.json({ error: 'withdrawals required' }, { status: 400 })
  }

  const dream = await db.dream.findUnique({
    where: { id },
    include: { assets: { where: { active: true } } },
  })
  if (!dream) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (dream.status === 'realizado') {
    return NextResponse.json({ error: 'Dream already realized' }, { status: 400 })
  }

  // Snapshot current allocation deviations before realization
  const [allAssets, allTargets] = await Promise.all([
    db.asset.findMany({ where: { active: true } }),
    db.allocationTarget.findMany({ where: { mode: 'normal' } }),
  ])

  const portfolioTotal = allAssets.reduce((s, a) => s + Number(a.currentValue), 0)
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  await db.$transaction(async (tx) => {
    // 1. Update assets (reduce values)
    for (const w of withdrawals) {
      const asset = await tx.asset.findUnique({ where: { id: w.assetId } })
      if (!asset) continue
      const newValue = Math.max(0, Number(asset.currentValue) - Number(w.amount))
      await tx.asset.update({
        where: { id: w.assetId },
        data: { currentValue: newValue, lastUpdated: new Date() },
      })
      await tx.assetSnapshot.upsert({
        where: { assetId_month: { assetId: w.assetId, month: currentMonth } },
        update: { value: newValue },
        create: { assetId: w.assetId, month: currentMonth, value: newValue },
      })
      // Clear dream association
      await tx.asset.update({ where: { id: w.assetId }, data: { dreamId: null, purpose: 'personal' } })
    }

    // 2. Mark dream as realized
    await tx.dream.update({
      where: { id },
      data: {
        status: 'realizado',
        achievedAt: new Date(),
        ...(notes && { notes: String(notes) }),
      },
    })

    // 3. Save initial deviation snapshots (for rebalancing progress tracking)
    if (portfolioTotal > 0) {
      const byType: Record<string, number> = {}
      allAssets.forEach((a) => {
        byType[a.type] = (byType[a.type] ?? 0) + Number(a.currentValue)
      })

      const snapshots = allTargets.map((t) => {
        const currentPct = ((byType[t.assetType] ?? 0) / portfolioTotal) * 100
        const deviation = currentPct - t.targetPct
        return { dreamId: id, assetType: t.assetType, deviationPct: Number(deviation.toFixed(2)) }
      })

      await tx.dreamRebalancingSnapshot.createMany({ data: snapshots })
    }

    // 4. Promote next dream
    const next = await tx.dream.findFirst({
      where: { status: 'planejando' },
      orderBy: { priorityOrder: 'asc' },
    })
    if (next) {
      await tx.dream.update({ where: { id: next.id }, data: { status: 'acumulando' } })
    }
  })

  // 5. Update portfolio state to REBALANCEANDO
  // (portfolio-state lib reads from DB; we set it via AllocationTarget mode context)
  // Portfolio state is computed dynamically — no extra write needed

  return NextResponse.json({ success: true, dreamId: id })
}
