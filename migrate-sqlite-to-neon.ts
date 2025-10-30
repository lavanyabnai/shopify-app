/**
 * Migrate SQLite Data to Neon PostgreSQL
 *
 * This script uses raw SQL to export from SQLite and import to Neon
 * since we can't have two Prisma clients with different providers simultaneously.
 *
 * Usage: npx tsx migrate-sqlite-to-neon.ts
 */

import Database from 'better-sqlite3';
import { Client } from 'pg';
import { readFileSync } from 'fs';

// Load environment variables from .env file
const envContent = readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    // Remove surrounding quotes
    value = value.replace(/^["']|["']$/g, '');
    envVars[key] = value;
  }
});

const NEON_URL = envVars.DATABASE_URL_NEON || process.env.DATABASE_URL_NEON;
if (!NEON_URL) {
  console.error('❌ DATABASE_URL_NEON not found in .env file');
  process.exit(1);
}

const SQLITE_PATH = './prisma/dev.sqlite';

interface TableRow {
  [key: string]: any;
}

async function main() {
  console.log('🚀 Starting SQLite to Neon migration...\n');

  // Connect to SQLite
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log('✅ Connected to SQLite');

  // Connect to Neon
  const neon = new Client({ connectionString: NEON_URL });
  await neon.connect();
  console.log('✅ Connected to Neon PostgreSQL\n');

  try {
    // Get list of tables from SQLite
    const tables = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    console.log(`📋 Found ${tables.length} tables to migrate\n`);

    let totalMigrated = 0;

    for (const { name: tableName } of tables) {
      console.log(`📦 Migrating table: ${tableName}`);

      // Get all rows from SQLite
      const rows = sqlite.prepare(`SELECT * FROM "${tableName}"`).all() as TableRow[];

      if (rows.length === 0) {
        console.log(`   ℹ️  Table is empty, skipping\n`);
        continue;
      }

      console.log(`   Found ${rows.length} rows`);

      // Get column names from first row
      const columns = Object.keys(rows[0]);

      let migrated = 0;
      let skipped = 0;
      let errors = 0;

      // Insert each row into Neon
      for (const row of rows) {
        try {
          const values = columns.map((col) => row[col]);
          const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
          const columnList = columns.map((c) => `"${c}"`).join(', ');

          // Use INSERT ... ON CONFLICT DO UPDATE for idempotency
          const conflictColumn = columns.includes('id') ? 'id' : columns[0];
          const updateSet = columns
            .filter((c) => c !== conflictColumn)
            .map((c) => `"${c}" = EXCLUDED."${c}"`)
            .join(', ');

          const query = `
            INSERT INTO "${tableName}" (${columnList})
            VALUES (${placeholders})
            ON CONFLICT ("${conflictColumn}")
            DO UPDATE SET ${updateSet || `"${conflictColumn}" = EXCLUDED."${conflictColumn}"`}
          `;

          await neon.query(query, values);
          migrated++;
        } catch (error: any) {
          if (error.code === '23505') {
            // Unique constraint violation
            skipped++;
          } else {
            console.error(`   ❌ Error migrating row:`, error.message);
            errors++;
          }
        }
      }

      totalMigrated += migrated;
      console.log(`   ✅ ${migrated} rows migrated, ${skipped} skipped, ${errors} errors\n`);
    }

    console.log('═'.repeat(60));
    console.log(`🎉 Migration complete: ${totalMigrated} total rows migrated`);
    console.log('═'.repeat(60));
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    sqlite.close();
    await neon.end();
  }
}

main().catch(console.error);
