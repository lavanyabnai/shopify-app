/**
 * Sync Local SQLite Data to Neon PostgreSQL
 *
 * This script performs a full data sync from your local SQLite database
 * to the Neon PostgreSQL cloud replica.
 *
 * Usage:
 *   npx tsx sync-to-neon.ts
 *
 * Options:
 *   --verify-only  Only verify connection, don't sync
 *   --stats-only   Show sync statistics without syncing
 */

import { syncToNeon, verifyNeonConnection, getNeonSyncStats } from './app/services/neon-sync.server';

async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only');
  const statsOnly = args.includes('--stats-only');

  console.log('🔄 Neon PostgreSQL Sync Tool\n');

  // Verify connection first
  console.log('📡 Verifying Neon connection...');
  const isConnected = await verifyNeonConnection();

  if (!isConnected) {
    console.error('\n❌ Failed to connect to Neon PostgreSQL');
    console.error('Please check your DATABASE_URL_NEON in .env file');
    process.exit(1);
  }

  if (verifyOnly) {
    console.log('\n✅ Connection verified successfully');
    process.exit(0);
  }

  // Show stats only
  if (statsOnly) {
    console.log('\n📊 Fetching sync statistics...\n');
    const stats = await getNeonSyncStats();

    if (stats) {
      console.log('Model              Local    Neon     Diff');
      console.log('═════════════════════════════════════════');
      for (const [model, counts] of Object.entries(stats)) {
        const padding = ' '.repeat(18 - model.length);
        const diff = counts.diff > 0 ? `+${counts.diff}` : counts.diff.toString();
        console.log(`${model}${padding}${counts.local.toString().padStart(6)}  ${counts.neon.toString().padStart(6)}  ${diff.padStart(6)}`);
      }
      console.log('═════════════════════════════════════════\n');
    }
    process.exit(0);
  }

  // Full sync
  console.log('\n🚀 Starting full sync to Neon PostgreSQL...');
  console.log('This may take a few minutes depending on data volume.\n');

  const result = await syncToNeon();

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('SYNC SUMMARY');
  console.log('═'.repeat(60));

  if (result.success) {
    console.log(`✅ Status: SUCCESS`);
  } else {
    console.log(`❌ Status: FAILED`);
  }

  console.log(`📊 Total Records Synced: ${result.totalSynced}`);
  console.log(`❌ Total Errors: ${result.totalErrors}`);
  console.log('\nPer-Model Breakdown:');
  console.log('─'.repeat(60));

  for (const stat of result.stats) {
    if (stat.synced > 0 || stat.errors > 0) {
      const status = stat.errors > 0 ? '⚠️ ' : '✅';
      console.log(`${status} ${stat.model.padEnd(25)} ${stat.synced.toString().padStart(6)} synced  ${stat.errors.toString().padStart(4)} errors`);
    }
  }

  console.log('═'.repeat(60) + '\n');

  if (result.success) {
    console.log('🎉 All data successfully synced to Neon PostgreSQL!');
    console.log('💡 Your application is now ready to use the cloud database.');
    console.log('\nNext steps:');
    console.log('1. Update DATABASE_URL in .env to use DATABASE_URL_NEON');
    console.log('2. Restart your application');
    console.log('3. Webhooks will keep data in sync automatically\n');
  } else {
    console.log('⚠️  Sync completed with errors. Please review the logs above.');
    console.log('💡 You can safely re-run this script to retry failed records.\n');
  }

  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
