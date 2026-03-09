import { NextResponse } from 'next/server'
import { prisma as db } from '@/lib/db'

// Default rates per asset category
const DEFAULTS: { assetCategory: string; annualRate: number; irRate: number }[] = [
  { assetCategory: 'tesouro',          annualRate: 0.105, irRate: 0.175 },
  { assetCategory: 'cdb',              annualRate: 0.105, irRate: 0.175 },
  { assetCategory: 'lci_lca',          annualRate: 0.095, irRate: 0.0   },
  { assetCategory: 'fii',              annualRate: 0.096, irRate: 0.0   },
  { assetCategory: 'acoes',            annualRate: 0.12,  irRate: 0.15  },
  { assetCategory: 'cripto',           annualRate: 0.20,  irRate: 0.15  },
  { assetCategory: 'previdencia',      annualRate: 0.08,  irRate: 0.15  },
  { assetCategory: 'fundo',            annualRate: 0.09,  irRate: 0.15  },
  { assetCategory: 'conta_remunerada', annualRate: 0.105, irRate: 0.175 },
]

async function ensureSeeded() {
  const count = await db.projectionParams.count()
  if (count === 0) {
    await db.projectionParams.createMany({ data: DEFAULTS })
    await db.globalParams.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton', inflationRate: 0.045 },
    })
  }
}

export async function GET() {
  await ensureSeeded()
  const [params, global] = await Promise.all([
    db.projectionParams.findMany({ orderBy: { assetCategory: 'asc' } }),
    db.globalParams.findUnique({ where: { id: 'singleton' } }),
  ])
  return NextResponse.json({ params, global })
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { params, inflationRate } = body as {
    params: { assetCategory: string; annualRate: number; irRate: number }[]
    inflationRate?: number
  }

  await Promise.all([
    ...params.map((p) =>
      db.projectionParams.upsert({
        where: { assetCategory: p.assetCategory },
        update: { annualRate: p.annualRate, irRate: p.irRate },
        create: p,
      })
    ),
    inflationRate !== undefined
      ? db.globalParams.upsert({
          where: { id: 'singleton' },
          update: { inflationRate },
          create: { id: 'singleton', inflationRate },
        })
      : Promise.resolve(),
  ])

  const [updated, global] = await Promise.all([
    db.projectionParams.findMany({ orderBy: { assetCategory: 'asc' } }),
    db.globalParams.findUnique({ where: { id: 'singleton' } }),
  ])
  return NextResponse.json({ params: updated, global })
}

export async function POST() {
  // Reset to defaults
  await Promise.all([
    db.projectionParams.deleteMany(),
    db.globalParams.deleteMany(),
  ])
  await db.projectionParams.createMany({ data: DEFAULTS })
  await db.globalParams.create({ data: { id: 'singleton', inflationRate: 0.045 } })

  const [params, global] = await Promise.all([
    db.projectionParams.findMany({ orderBy: { assetCategory: 'asc' } }),
    db.globalParams.findUnique({ where: { id: 'singleton' } }),
  ])
  return NextResponse.json({ params, global })
}
