import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...\n');

    // Test basic query
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log('✅ Database connection successful!');
    console.log('Result:', result);

    // Count sessions
    const sessionCount = await prisma.session.count();
    console.log(`\n📊 Found ${sessionCount} session(s) in database`);

    // Test War Room models
    const warRoomCount = await prisma.warRoomMetrics.count();
    console.log(`📊 Found ${warRoomCount} war room metric(s)`);

    const snapshotCount = await prisma.inventorySnapshot.count();
    console.log(`📊 Found ${snapshotCount} inventory snapshot(s)`);

    console.log('\n✅ All database models accessible!');

  } catch (error) {
    console.error('❌ Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
