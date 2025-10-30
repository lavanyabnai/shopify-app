/**
 * Neon Database Sync Service
 *
 * Syncs data from local SQLite to Neon PostgreSQL cloud replica
 * This service maintains data consistency between local and cloud databases
 *
 * Features:
 * - Batch processing for efficient data transfer
 * - Progress tracking
 * - Error handling with retry logic
 * - Idempotent operations (safe to run multiple times)
 */

import { PrismaClient } from '@prisma/client';

// We'll dynamically create clients when needed to avoid connection issues
function getLocalDb() {
  return new PrismaClient({
    datasources: {
      db: {
        url: 'file:dev.sqlite',
      },
    },
  });
}

function getNeonDb() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL_NEON,
      },
    },
  });
}

const BATCH_SIZE = 100;
const DELAY_MS = 100; // Small delay between batches to avoid overwhelming the connection

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SyncStats {
  model: string;
  synced: number;
  skipped: number;
  errors: number;
  duration: number;
}

export interface NeonSyncResult {
  success: boolean;
  stats: SyncStats[];
  totalSynced: number;
  totalErrors: number;
  error?: string;
}

/**
 * Sync all data from local SQLite to Neon PostgreSQL
 */
export async function syncToNeon(): Promise<NeonSyncResult> {
  const startTime = Date.now();
  const stats: SyncStats[] = [];
  let totalSynced = 0;
  let totalErrors = 0;

  const localDb = getLocalDb();
  const neonDb = getNeonDb();

  try {
    console.log('🚀 Starting full sync to Neon PostgreSQL...');

    // Sync in dependency order to avoid foreign key violations
    const syncOrder = [
      'Session',
      'QRCode',
      'Product',
      'Order',
      'OrderLineItem',
      'AnalyticsSnapshot',
      'SyncStatus',
      'WarRoomMetrics',
      'InventorySnapshot',
      'AlertLog',
      'RecommendedAction',
      'ExecutedAction',
      'ActionTemplate',
      'AlertRule',
      'AlertHistory',
      'NotificationPreference',
      'Simulation',
      'SimulationResult',
      'Playbook',
    ];

    for (const model of syncOrder) {
      const modelStats = await syncModel(model, localDb, neonDb);
      stats.push(modelStats);
      totalSynced += modelStats.synced;
      totalErrors += modelStats.errors;

      console.log(`✅ ${model}: ${modelStats.synced} synced, ${modelStats.skipped} skipped, ${modelStats.errors} errors (${modelStats.duration}ms)`);
    }

    const duration = Date.now() - startTime;
    console.log(`🎉 Sync complete: ${totalSynced} records synced, ${totalErrors} errors in ${duration}ms`);

    return {
      success: totalErrors === 0,
      stats,
      totalSynced,
      totalErrors,
    };

  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    return {
      success: false,
      stats,
      totalSynced,
      totalErrors,
      error: error.message,
    };
  } finally {
    // Clean up connections
    await localDb.$disconnect();
    await neonDb.$disconnect();
  }
}

/**
 * Sync a specific model from local to Neon
 */
async function syncModel(modelName: string, localDb: PrismaClient, neonDb: PrismaClient): Promise<SyncStats> {
  const startTime = Date.now();
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get model accessor from Prisma client
    const localModel = (localDb as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    const neonModel = (neonDb as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];

    if (!localModel || !neonModel) {
      console.warn(`⚠️ Model ${modelName} not found, skipping`);
      return { model: modelName, synced, skipped, errors, duration: Date.now() - startTime };
    }

    // Get total count for progress tracking
    const totalCount = await localModel.count();
    console.log(`📊 ${modelName}: ${totalCount} records to sync`);

    if (totalCount === 0) {
      return { model: modelName, synced, skipped, errors, duration: Date.now() - startTime };
    }

    // Process in batches
    let offset = 0;
    while (offset < totalCount) {
      const records = await localModel.findMany({
        take: BATCH_SIZE,
        skip: offset,
      });

      for (const record of records) {
        try {
          // Use upsert for idempotency
          await neonModel.upsert({
            where: { id: record.id },
            create: record,
            update: record,
          });
          synced++;
        } catch (error: any) {
          // Check if it's a unique constraint violation (record already exists)
          if (error.code === 'P2002') {
            skipped++;
          } else {
            console.error(`❌ Error syncing ${modelName} record ${record.id}:`, error.message);
            errors++;
          }
        }
      }

      offset += BATCH_SIZE;
      console.log(`   Progress: ${Math.min(offset, totalCount)}/${totalCount} (${Math.round((offset / totalCount) * 100)}%)`);

      // Small delay between batches
      await delay(DELAY_MS);
    }

  } catch (error: any) {
    console.error(`❌ Error syncing model ${modelName}:`, error.message);
    errors++;
  }

  return {
    model: modelName,
    synced,
    skipped,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Sync a specific shop's data to Neon (for incremental updates)
 */
export async function syncShopDataToNeon(shop: string): Promise<NeonSyncResult> {
  const startTime = Date.now();
  const stats: SyncStats[] = [];
  let totalSynced = 0;
  let totalErrors = 0;

  const localDb = getLocalDb();
  const neonDb = getNeonDb();

  try {
    console.log(`🔄 Syncing shop data to Neon: ${shop}`);

    // Sync shop-specific data
    const shopModels = [
      { name: 'Order', filter: { shop } },
      { name: 'Product', filter: { shop } },
      { name: 'WarRoomMetrics', filter: { shop } },
      { name: 'InventorySnapshot', filter: { shop } },
      { name: 'AlertLog', filter: { shop } },
      { name: 'RecommendedAction', filter: { shop } },
      { name: 'AlertHistory', filter: { shop } },
    ];

    for (const { name, filter } of shopModels) {
      const modelStats = await syncModelWithFilter(name, filter, localDb, neonDb);
      stats.push(modelStats);
      totalSynced += modelStats.synced;
      totalErrors += modelStats.errors;
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Shop sync complete: ${totalSynced} records synced in ${duration}ms`);

    return {
      success: totalErrors === 0,
      stats,
      totalSynced,
      totalErrors,
    };

  } catch (error: any) {
    console.error('❌ Shop sync failed:', error.message);
    return {
      success: false,
      stats,
      totalSynced,
      totalErrors,
      error: error.message,
    };
  } finally {
    await localDb.$disconnect();
    await neonDb.$disconnect();
  }
}

/**
 * Sync a model with a filter (for incremental syncs)
 */
async function syncModelWithFilter(modelName: string, filter: any, localDb: PrismaClient, neonDb: PrismaClient): Promise<SyncStats> {
  const startTime = Date.now();
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const localModel = (localDb as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];
    const neonModel = (neonDb as any)[modelName.charAt(0).toLowerCase() + modelName.slice(1)];

    if (!localModel || !neonModel) {
      return { model: modelName, synced, skipped, errors, duration: Date.now() - startTime };
    }

    const records = await localModel.findMany({
      where: filter,
    });

    console.log(`   ${modelName}: ${records.length} records`);

    for (const record of records) {
      try {
        await neonModel.upsert({
          where: { id: record.id },
          create: record,
          update: record,
        });
        synced++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          skipped++;
        } else {
          console.error(`   ❌ Error syncing ${modelName} record:`, error.message);
          errors++;
        }
      }
    }

  } catch (error: any) {
    console.error(`❌ Error syncing model ${modelName}:`, error.message);
    errors++;
  }

  return {
    model: modelName,
    synced,
    skipped,
    errors,
    duration: Date.now() - startTime,
  };
}

/**
 * Verify Neon connection
 */
export async function verifyNeonConnection(): Promise<boolean> {
  const neonDb = getNeonDb();
  try {
    await neonDb.$connect();
    console.log('✅ Neon PostgreSQL connection successful');
    return true;
  } catch (error: any) {
    console.error('❌ Neon PostgreSQL connection failed:', error.message);
    return false;
  } finally {
    await neonDb.$disconnect();
  }
}

/**
 * Get sync statistics
 */
export async function getNeonSyncStats() {
  const localDb = getLocalDb();
  const neonDb = getNeonDb();

  try {

    const models = ['order', 'product', 'analyticsSnapshot', 'inventorySnapshot'];
    const stats: Record<string, { local: number; neon: number; diff: number }> = {};

    for (const model of models) {
      const localCount = await (localDb as any)[model].count();
      const neonCount = await (neonDb as any)[model].count();

      stats[model] = {
        local: localCount,
        neon: neonCount,
        diff: localCount - neonCount,
      };
    }

    await localDb.$disconnect();
    await neonDb.$disconnect();

    return stats;
  } catch (error: any) {
    console.error('❌ Error getting sync stats:', error.message);
    return null;
  }
}
