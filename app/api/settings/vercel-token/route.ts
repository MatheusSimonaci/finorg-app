import { NextRequest, NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'
import { encryptToken } from '@/lib/security/token-store'

/** GET — returns whether token is configured (never returns the token itself) */
export async function GET() {
  const settings = await db.snapshotSettings.findUnique({ where: { id: 'singleton' } })
  return NextResponse.json({ configured: !!settings?.vercelTokenEnc })
}

/** POST { token: string } — encrypt and store Vercel token */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { token?: string }
  if (!body.token || typeof body.token !== 'string' || body.token.trim().length === 0) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 400 })
  }

  const tokenTrimmed = body.token.trim()
  // Basic validation: Vercel tokens start with specific prefix patterns
  if (tokenTrimmed.length < 20) {
    return NextResponse.json({ error: 'Token muito curto. Verifique o token.' }, { status: 400 })
  }

  const encrypted = encryptToken(tokenTrimmed)

  await db.snapshotSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', vercelTokenEnc: encrypted, updatedAt: new Date() },
    update: { vercelTokenEnc: encrypted },
  })

  return NextResponse.json({ ok: true })
}

/** DELETE — remove stored Vercel token */
export async function DELETE() {
  await db.snapshotSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', vercelTokenEnc: null, updatedAt: new Date() },
    update: { vercelTokenEnc: null },
  })
  return NextResponse.json({ ok: true })
}
