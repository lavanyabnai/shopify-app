/**
 * Check if db import works correctly
 */

async function checkDb() {
  console.log('🔍 Checking database import...\n');

  try {
    // Import the db module
    const dbModule = await import('./app/db.server.ts');
    const db = dbModule.default;

    console.log('✅ db imported successfully');
    console.log('   Type:', typeof db);
    console.log('   Has alertHistory:', !!db.alertHistory);
    console.log('   Has alertRule:', !!db.alertRule);
    console.log('   Has notificationPreference:', !!db.notificationPreference);

    if (db.alertHistory) {
      const count = await db.alertHistory.count();
      console.log(`\n✅ AlertHistory count: ${count}`);
    }

    if (db.alertRule) {
      const count = await db.alertRule.count();
      console.log(`✅ AlertRule count: ${count}`);
    }

    await db.$disconnect();
    console.log('\n✅ All checks passed!');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkDb();
