import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const settings = await db.snapshotSettings.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json({
    privacyMode: settings?.privacyMode ?? 'public',
    maskValues: settings?.maskValues ?? false,
    hasPassword: !!(settings?.privacyMode === 'protected' && settings.passwordHash),
    lastDeployUrl: settings?.lastDeployUrl ?? null,
    lastDeployedAt: settings?.lastDeployedAt?.toISOString() ?? null,
    vercelConfigured: !!settings?.vercelTokenEnc,
  })
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as {
    privacyMode?: 'public' | 'protected'
    password?: string
    maskValues?: boolean
  }

  let passwordHash: string | null | undefined = undefined

  if (body.privacyMode === 'protected') {
    if (!body.password || body.password.trim().length === 0) {
      return NextResponse.json({ error: 'Senha obrigatória no modo protegido.' }, { status: 400 })
    }
    if (body.password.length < 4) {
      return NextResponse.json({ error: 'Senha deve ter ao menos 4 caracteres.' }, { status: 400 })
    }
    passwordHash = await bcrypt.hash(body.password, 10)
  } else if (body.privacyMode === 'public') {
    passwordHash = null
  }

  const updateData: Record<string, unknown> = {}
  if (body.privacyMode !== undefined) updateData.privacyMode = body.privacyMode
  if (passwordHash !== undefined) updateData.passwordHash = passwordHash
  if (body.maskValues !== undefined) updateData.maskValues = body.maskValues

  await db.snapshotSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      privacyMode: body.privacyMode ?? 'public',
      passwordHash: passwordHash ?? null,
      maskValues: body.maskValues ?? false,
      updatedAt: new Date(),
    },
    update: updateData,
  })

  return NextResponse.json({ ok: true })
}
