import { createClient } from '@libsql/client'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const url = process.env.TURSO_DATABASE_URL!
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url?.startsWith('libsql://')) {
  console.error('❌ TURSO_DATABASE_URL not set or not libsql://')
  process.exit(1)
}

const client = createClient({ url, authToken })

async function run() {
  try {
    // Test quantity column
    const r1 = await client.execute('SELECT id, quantity, unitPrice FROM "Transaction" LIMIT 1')
    console.log('✅ quantity + unitPrice columns OK, rows:', r1.rows.length)

    // Row counts
    const tables = ['Transaction', 'Account', 'Asset', 'User', '_prisma_migrations']
    for (const t of tables) {
      const r = await client.execute(`SELECT COUNT(*) as cnt FROM "${t}"`)
      console.log(`✅ ${t}: ${r.rows[0][0]} rows`)
    }
  } catch (e: unknown) {
    console.error('❌ FAIL:', (e as Error).message)
    process.exit(1)
  } finally {
    client.close()
  }
}

run()
