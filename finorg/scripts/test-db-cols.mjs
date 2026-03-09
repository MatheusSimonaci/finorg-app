// @ts-check
import { PrismaClient } from '../app/generated/prisma/client.ts'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSQL({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function run() {
  try {
    const tx = await prisma.transaction.findFirst({
      select: { id: true, quantity: true, unitPrice: true },
    })
    console.log('✅ quantity+unitPrice columns accessible:', JSON.stringify(tx))

    const counts = {
      transactions: await prisma.transaction.count(),
      accounts: await prisma.account.count(),
      assets: await prisma.asset.count(),
      users: await prisma.user.count(),
    }
    console.log('✅ DB counts:', JSON.stringify(counts))
  } catch (e) {
    console.error('❌ FAIL:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

run()
