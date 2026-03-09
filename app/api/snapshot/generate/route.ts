import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { generateSnapshot, defaultSnapshotDir } from '@/lib/snapshot/generator'
import { decryptToken } from '@/lib/security/token-store'

export async function POST() {
  try {
    // Load privacy/snapshot settings
    const settings = await db.snapshotSettings.findUnique({ where: { id: 'singleton' } })

    const maskValues = settings?.maskValues ?? false
    let passwordHash: string | undefined

    if (settings?.privacyMode === 'protected' && settings.passwordHash) {
      passwordHash = settings.passwordHash
    }

    const outputDir = defaultSnapshotDir()
    const result = await generateSnapshot(outputDir, passwordHash, maskValues)

    return NextResponse.json({
      path: '/snapshot/index.html',
      generatedAt: result.generatedAt,
      fileSizeKB: result.fileSizeKB,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
