# Neon Database Setup Guide

This guide explains how to properly configure Prisma with Neon's PostgreSQL database.

## The Problem

Neon provides two types of connection strings:
- **Pooled Connection** (`-pooler` in URL): For runtime queries, better performance
- **Direct Connection** (no `-pooler`): For migrations and schema operations

Prisma migrations require advisory locks, which are **not supported** by Neon's connection pooler. This causes timeout errors like:

```
Error: P1002
Timed out trying to acquire a postgres advisory lock
```

## The Solution

### 1. Configure Two Connection Strings in `.env`

```bash
# DIRECT CONNECTION - Use for migrations (required for advisory locks)
DATABASE_URL_NEON_DIRECT="postgresql://neondb_owner:PASSWORD@ENDPOINT.neon.tech/DATABASE?sslmode=require"

# POOLED CONNECTION - Use for runtime queries (better performance)
DATABASE_URL_NEON="postgresql://neondb_owner:PASSWORD@ENDPOINT-pooler.neon.tech/DATABASE?sslmode=require&pgbouncer=true"
```

**Key differences:**
- Direct: `ENDPOINT.neon.tech` (no `-pooler`)
- Pooled: `ENDPOINT-pooler.neon.tech` (has `-pooler`)

### 2. Configure `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL_NEON")           // Pooled for queries
  directUrl = env("DATABASE_URL_NEON_DIRECT")   // Direct for migrations
}
```

### 3. Run Migrations

```bash
# Regenerate Prisma client
npx prisma generate

# Deploy migrations (uses directUrl automatically)
npx prisma migrate deploy

# Alternative: Push schema without migration tracking
npx prisma db push
```

## When Advisory Lock Timeout Still Occurs

If you encounter the timeout error even with the correct configuration:

### Option 1: Wait and Retry
Neon automatically terminates idle connections after a few minutes.

```bash
# Wait 5 minutes, then retry
npx prisma migrate deploy
```

### Option 2: Use `db push` Instead
Bypasses the migration system and advisory locks:

```bash
npx prisma db push --accept-data-loss
```

**Note:** This updates the schema but doesn't create migration files.

### Option 3: Restart from Neon Console
1. Go to [console.neon.tech](https://console.neon.tech)
2. Navigate to your project
3. Restart the database

## Best Practices

### Development
- ✅ Use `DATABASE_URL_NEON` (pooled) as default in `.env`
- ✅ Set `directUrl` in `schema.prisma`
- ✅ Run migrations during low-traffic periods

### Production
- ✅ Always use pooled connections for runtime
- ✅ Set `DATABASE_URL_NEON_DIRECT` in environment variables
- ✅ Run migrations in CI/CD with retry logic

### Testing the Connection

Run this command to verify both connections work:

```bash
npx tsx test-db-connection.ts
```

Expected output:
```
✅ Database connection successful!
📊 Found X session(s) in database
✅ All database models accessible!
```

## Environment Variables Summary

| Variable | Purpose | Required For |
|----------|---------|--------------|
| `DATABASE_URL_NEON` | Pooled connection | Runtime queries |
| `DATABASE_URL_NEON_DIRECT` | Direct connection | Migrations only |

## Troubleshooting

### Error: "column pg_locks.pid is ambiguous"
Use table aliases in queries:
```sql
SELECT l.pid FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
```

### Error: "function pg_terminate_backend(bigint) does not exist"
Neon's serverless architecture has some PostgreSQL limitations. Use `db push` or wait for auto-termination instead.

### Migration hangs for 10+ seconds
The direct connection URL might not be configured correctly. Check:
1. `.env` has `DATABASE_URL_NEON_DIRECT` without `-pooler`
2. `schema.prisma` has `directUrl = env("DATABASE_URL_NEON_DIRECT")`

## Additional Resources

- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Prisma with Neon](https://neon.tech/docs/guides/prisma)
- [Prisma Advisory Locking](https://pris.ly/d/migrate-advisory-locking)

## Related Files

- Configuration: [.env](.env)
- Schema: [prisma/schema.prisma](prisma/schema.prisma)
- Test script: [test-db-connection.ts](test-db-connection.ts)
