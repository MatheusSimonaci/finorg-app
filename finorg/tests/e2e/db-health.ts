/**
 * DB Health Check — Tests 6 & 7
 * Verifies DB connectivity, table counts, and the `quantity` column regression fix.
 * Run with: npx tsx tests/e2e/db-health.ts
 */

// We use the tsconfig paths — tsx resolves them
import { prisma } from '../../lib/db';

interface Result {
  test: string;
  passed: boolean;
  details: string;
}

const results: Result[] = [];

async function run() {
  try {
    // Test 6a: Basic connectivity + counts
    try {
      const [txCount, acctCount, assetCount] = await Promise.all([
        prisma.transaction.count(),
        prisma.account.count(),
        prisma.asset.count(),
      ]);
      results.push({
        test: '[DB] Basic connectivity + table counts',
        passed: true,
        details: `Transactions: ${txCount}, Accounts: ${acctCount}, Assets: ${assetCount}`,
      });
    } catch (e) {
      results.push({
        test: '[DB] Basic connectivity + table counts',
        passed: false,
        details: String(e),
      });
    }

    // Tests 6b / 7: quantity column regression check
    try {
      const txSample = await prisma.transaction.findFirst({
        select: { id: true, quantity: true },
      });
      results.push({
        test: '[DB] REGRESSION — quantity column accessible',
        passed: true,
        details: txSample
          ? `Sample: id=${txSample.id}, quantity=${txSample.quantity}`
          : 'Column exists (no rows returned, but no error)',
      });
    } catch (e) {
      results.push({
        test: '[DB] REGRESSION — quantity column accessible',
        passed: false,
        details: `ERROR: ${String(e)}`,
      });
    }

    // Test 7b: Asset findFirst
    try {
      const asset = await prisma.asset.findFirst();
      results.push({
        test: '[DB] prisma.asset.findFirst()',
        passed: true,
        details: asset ? `Sample id=${asset.id}` : 'No assets in DB (table exists, no rows)',
      });
    } catch (e) {
      results.push({
        test: '[DB] prisma.asset.findFirst()',
        passed: false,
        details: String(e),
      });
    }

    // Test 6c: Dream count
    try {
      const dreamCount = await prisma.dream.count();
      results.push({
        test: '[DB] prisma.dream.count()',
        passed: true,
        details: `Dreams: ${dreamCount}`,
      });
    } catch (e) {
      results.push({
        test: '[DB] prisma.dream.count()',
        passed: false,
        details: String(e),
      });
    }

  } finally {
    await prisma.$disconnect();
  }

  // Print results
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
}

run().catch(e => {
  console.error('Fatal error in DB health check:', e);
  process.exit(1);
});
