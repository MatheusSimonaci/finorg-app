import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { defaultSnapshotDir } from '@/lib/snapshot/generator'
import { deployToVercel } from '@/lib/snapshot/vercel-deployer'
import { decryptToken } from '@/lib/security/token-store'

export async function POST() {
  try {
    const settings = await db.snapshotSettings.findUnique({ where: { id: 'singleton' } })

    if (!settings?.vercelTokenEnc) {
      return NextResponse.json(
        { error: 'Token Vercel não configurado. Adicione o token nas Configurações.' },
        { status: 400 },
      )
    }

    let token: string
    try {
      token = decryptToken(settings.vercelTokenEnc)
    } catch {
      return NextResponse.json(
        { error: 'Falha ao descriptografar o token. Reconfigure o token Vercel nas Configurações.' },
        { status: 500 },
      )
    }

    const snapshotDir = defaultSnapshotDir()
    const result = await deployToVercel(snapshotDir, token)

    // Persist deploy URL back to settings
    await db.snapshotSettings.upsert({
      where: { id: 'singleton' },
      create: {
        id: 'singleton',
        lastDeployUrl: result.url,
        lastDeployedAt: new Date(),
        updatedAt: new Date(),
      },
      update: { lastDeployUrl: result.url, lastDeployedAt: new Date() },
    })

    return NextResponse.json({ url: result.url, deploymentId: result.deploymentId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
