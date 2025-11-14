import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_NEON_DIRECT || process.env.DATABASE_URL_NEON
    }
  }
});

async function checkLocks() {
  try {
    console.log('Checking database locks...');

    const locks = await prisma.$queryRaw`
      SELECT
        l.locktype,
        l.database,
        l.pid,
        l.mode,
        l.granted,
        a.query_start,
        a.state,
        a.query
      FROM pg_locks l
      JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.locktype = 'advisory'
    `;

    console.log('Advisory locks:', locks);

    if (Array.isArray(locks) && locks.length === 0) {
      console.log('✅ No advisory locks found');
    }

  } catch (error) {
    console.error('Error checking locks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLocks();
