/**
 * DB Health Check — Test 6 & 7
 * Verifies connectivity, counts, and the `quantity` column regression fix
 */
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// We import the generated Prisma client directly (use file:// URL for Windows)
const clientPath = path.join(PROJECT_ROOT, 'app/generated/prisma/client/index.js');
const clientUrl = new URL(`file:///${clientPath.replace(/\\/g, '/')}`);
const { PrismaClient } = await import(clientUrl.href);

const { PrismaLibSQL } = await import('@prisma/adapter-libsql');

const dbPath = path.join(PROJECT_ROOT, 'prisma/dev.db').replace(/\\/g, '/');
const adapter = new PrismaLibSQL({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const results = [];

try {
  // Test 6a: Basic connectivity + table counts
  let passed = true;
  let details = '';
  try {
    const [txCount, acctCount, assetCount] = await Promise.all([
      prisma.transaction.count(),
      prisma.account.count(),
      prisma.asset.count(),
    ]);
    details = `Transactions: ${txCount}, Accounts: ${acctCount}, Assets: ${assetCount}`;
    results.push({ test: '[DB] Basic connectivity + table counts', passed: true, details });
  } catch (e) {
    results.push({ test: '[DB] Basic connectivity + table counts', passed: false, details: String(e) });
    passed = false;
  }

  // Test 6b / Test 7: quantity column accessible
  try {
    const txSample = await prisma.transaction.findFirst({
      select: { id: true, quantity: true }
    });
    const quantityAccessible = txSample !== undefined; // undefined = empty table, but no error = column exists
    results.push({
      test: '[DB] REGRESSION — quantity column accessible (prisma.transaction.findFirst)',
      passed: true,
      details: txSample
        ? `Sample: id=${txSample.id}, quantity=${txSample.quantity}`
        : 'Column accessible (table empty or no rows)'
    });
  } catch (e) {
    results.push({
      test: '[DB] REGRESSION — quantity column accessible',
      passed: false,
      details: `ERROR: ${String(e)}`
    });
  }

  // Test 7b: Asset findFirst
  try {
    const asset = await prisma.asset.findFirst();
    results.push({
      test: '[DB] prisma.asset.findFirst() works',
      passed: true,
      details: asset ? `Sample id=${asset.id}` : 'No assets in DB (table exists)'
    });
  } catch (e) {
    results.push({
      test: '[DB] prisma.asset.findFirst() works',
      passed: false,
      details: String(e)
    });
  }

  // Test 6c: Dream count
  try {
    const dreamCount = await prisma.dream.count();
    results.push({
      test: '[DB] prisma.dream.count()',
      passed: true,
      details: `Dreams: ${dreamCount}`
    });
  } catch (e) {
    results.push({
      test: '[DB] prisma.dream.count()',
      passed: false,
      details: String(e)
    });
  }

} finally {
  await prisma.$disconnect();
}

// Output results
console.log('\n=== DB HEALTH CHECK RESULTS ===\n');
let allPassed = true;
for (const r of results) {
  const icon = r.passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}  ${r.test}`);
  console.log(`       ${r.details}`);
  if (!r.passed) allPassed = false;
}
console.log('\n' + (allPassed ? '✅ DB ALL PASS' : '❌ DB HAS FAILURES') + '\n');

process.exit(allPassed ? 0 : 1);
