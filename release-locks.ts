import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_NEON_DIRECT || process.env.DATABASE_URL_NEON
    }
  }
});

async function releaseLocks() {
  try {
    console.log('Finding advisory locks...');

    // Get all advisory locks
    const locks: any[] = await prisma.$queryRaw`
      SELECT
        l.pid,
        a.state,
        a.query,
        a.query_start
      FROM pg_locks l
      JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.locktype = 'advisory'
    `;

    console.log(`Found ${locks.length} advisory lock(s)`);

    for (const lock of locks) {
      console.log(`\nLock info:`);
      console.log(`  PID: ${lock.pid}`);
      console.log(`  State: ${lock.state}`);
      console.log(`  Query: ${lock.query}`);
      console.log(`  Started: ${lock.query_start}`);

      if (lock.state === 'idle') {
        console.log(`  Terminating idle connection...`);
        try {
          await prisma.$queryRaw`SELECT pg_terminate_backend(${Number(lock.pid)})`;
          console.log(`  ✅ Terminated PID ${lock.pid}`);
        } catch (error) {
          console.log(`  ❌ Failed to terminate: ${error}`);
        }
      }
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('Error releasing locks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

releaseLocks();
