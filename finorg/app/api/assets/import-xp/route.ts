import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { parseXPPortfolioBuffer } from '@/lib/parsers/xp-portfolio'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'xls') {
      return NextResponse.json({ error: 'Formato não suportado. Envie um arquivo .xlsx ou .xls da XP.' }, { status: 422 })
    }

    const arrayBuf = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuf)
    const parsed = parseXPPortfolioBuffer(buffer)

    if (parsed.assets.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhum ativo encontrado no arquivo. Verifique se é uma "Posição Detalhada" da XP.',
          parseErrors: parsed.parseErrors,
        },
        { status: 422 },
      )
    }

    let created = 0
    let updated = 0
    let snapshots = 0

    for (const asset of parsed.assets) {
      // Upsert asset by (name, institution, type) — name + institution is usually unique enough
      const existing = await db.asset.findFirst({
        where: { name: asset.name, institution: 'xp', type: asset.type },
      })

      let assetId: string

      if (existing) {
        await db.asset.update({
          where: { id: existing.id },
          data: { currentValue: asset.currentValue, lastUpdated: new Date() },
        })
        assetId = existing.id
        updated++
      } else {
        const created_ = await db.asset.create({
          data: {
            name: asset.name,
            type: asset.type,
            institution: 'xp',
            currentValue: asset.currentValue,
            purpose: 'personal',
            active: true,
            lastUpdated: new Date(),
          },
        })
        assetId = created_.id
        created++
      }

      // Upsert AssetSnapshot for this month
      await db.assetSnapshot.upsert({
        where: { assetId_month: { assetId, month: parsed.month } },
        create: { assetId, month: parsed.month, value: asset.currentValue },
        update: { value: asset.currentValue },
      })
      snapshots++
    }

    return NextResponse.json({
      snapshotDate: parsed.snapshotDate,
      month: parsed.month,
      totalInvested: parsed.totalInvested,
      assetsCreated: created,
      assetsUpdated: updated,
      snapshotsUpserted: snapshots,
      parseErrors: parsed.parseErrors,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao processar arquivo: ${msg}` }, { status: 500 })
  }
}
