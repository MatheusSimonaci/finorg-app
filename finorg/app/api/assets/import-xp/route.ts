import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { parseXPPortfolioBuffer } from '@/lib/parsers/xp-portfolio'
import { generateTransactionHash } from '@/lib/utils'

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
    let txCreated = 0

    // Find or create XP investment account
    let xpAccount = await db.account.findFirst({ where: { institution: 'xp' } })
    if (!xpAccount) {
      xpAccount = await db.account.create({
        data: { name: 'XP Investimentos', institution: 'xp', type: 'investment' },
      })
    }

    const existingHashes = new Set(
      (await db.transaction.findMany({ select: { hash: true } })).map((t) => t.hash)
    )

    // Create an import batch for the transactions
    const batch = await db.importBatch.create({
      data: {
        fileName: file.name,
        bank: 'xp',
        imported: 0,
        duplicates: 0,
        errors: parsed.parseErrors.length,
        status: 'imported',
      },
    })

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

      // Also create a portfolio position transaction so average price can be tracked
      const txHash = generateTransactionHash(parsed.snapshotDate, `Posição ${asset.name}`, asset.currentValue)
      if (!existingHashes.has(txHash)) {
        await db.transaction.create({
          data: {
            date: new Date(parsed.snapshotDate),
            description: `Posição ${asset.name}`,
            amount: asset.currentValue,
            quantity: asset.quantity || null,
            unitPrice: asset.lastPrice || null,
            type: 'investimento',
            accountId: xpAccount!.id,
            rawData: JSON.stringify(asset),
            hash: txHash,
            importBatchId: batch.id,
            reviewStatus: 'pending',
          },
        })
        existingHashes.add(txHash)
        txCreated++
      }
    }

    // Update the batch's imported count
    await db.importBatch.update({
      where: { id: batch.id },
      data: { imported: txCreated },
    })

    return NextResponse.json({
      snapshotDate: parsed.snapshotDate,
      month: parsed.month,
      totalInvested: parsed.totalInvested,
      assetsCreated: created,
      assetsUpdated: updated,
      snapshotsUpserted: snapshots,
      transactionsCreated: txCreated,
      batchId: batch.id,
      parseErrors: parsed.parseErrors,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao processar arquivo: ${msg}` }, { status: 500 })
  }
}
