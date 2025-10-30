# Neon Connection Tips & Troubleshooting

## Connection Pool Configuration

### Issue: "Timed out fetching a new connection from the connection pool"

This happens when:
1. Multiple scripts/processes are holding connections
2. Connection pool is exhausted
3. Connection timeout is too low

### Solution: Optimized Connection String

Your `.env` now includes optimized connection parameters:

```env
DATABASE_URL_NEON="postgresql://neondb_owner:...@ep-dark-meadow-a68wijmr-pooler.us-west-2.aws.neon.tech/shopify_replica_db?sslmode=require&pgbouncer=true&connect_timeout=30&pool_timeout=30&connection_limit=5"
```

**Parameters Explained:**
- `pgbouncer=true` - Use PgBouncer connection pooling
- `connect_timeout=30` - 30 seconds to establish connection
- `pool_timeout=30` - 30 seconds to wait for available connection
- `connection_limit=5` - Max 5 connections per Prisma client instance

## Best Practices

### 1. Use Singleton Pattern

✅ **Good:**
```typescript
import db from './app/db.server';  // Singleton
```

❌ **Bad:**
```typescript
const db = new PrismaClient();  // New instance each time
```

### 2. Always Disconnect

✅ **Good:**
```typescript
try {
  await prisma.$connect();
  // ... do work
} finally {
  await prisma.$disconnect();
}
```

### 3. Limit Concurrent Connections

For background scripts that process many items:

```typescript
// Process in batches with connection management
const BATCH_SIZE = 100;

for (let i = 0; i < totalItems; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);

  // Optional: disconnect between batches
  await db.$disconnect();
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

## Neon Free Tier Limits

**Connection Limits:**
- **Compute time:** 100 hours/month
- **Storage:** 0.5 GB
- **Concurrent connections:** 20 (with PgBouncer)

**If you hit limits:**
1. Upgrade to Pro tier ($20/month)
2. Optimize connection usage
3. Use connection pooling (already configured)

## Testing Connection

### Quick Test
```bash
npx tsx -e "import db from './app/db.server.js'; await db.\$connect(); console.log('✅ OK'); await db.\$disconnect();"
```

### Full Test
```bash
npx tsx sync-to-neon.ts --verify-only
```

## Development vs Production

### Development
- Connection limit: 5 (to avoid exhausting pool during dev)
- Timeout: 30s (plenty of time for debugging)

### Production
Update for production:
```env
DATABASE_URL_NEON="...?sslmode=require&pgbouncer=true&connect_timeout=10&pool_timeout=10&connection_limit=10"
```

- Connection limit: 10 (higher traffic)
- Timeout: 10s (faster failure for retry logic)

## Monitoring

### Check Active Connections
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'shopify_replica_db';
```

### View in Neon Dashboard
https://console.neon.tech
- Go to your project
- Click "Monitoring"
- View "Connection count" graph

## Common Issues

### 1. Connection Hung

**Symptom:** App freezes on database operations

**Fix:**
```bash
# Kill all Node processes
pkill -9 node

# Restart app
npm run dev
```

### 2. Too Many Connections

**Symptom:** "sorry, too many clients already"

**Fix:**
- Wait a few seconds for connections to close
- Reduce `connection_limit` in connection string
- Use PgBouncer (already enabled)

### 3. Slow Queries

**Symptom:** Operations take >2 seconds

**Fix:**
1. Check indexes are created
2. Use Redis caching
3. Optimize queries in Neon dashboard

## Performance Tips

### 1. Use Caching
```typescript
// With caching (fast)
const data = await cache.getOrSet(
  CACHE_KEYS.ANALYTICS_SNAPSHOT(shop),
  () => db.order.findMany({ where: { shop } }),
  300  // 5 minute cache
);
```

### 2. Batch Queries
```typescript
// Instead of N queries
for (const id of ids) {
  await db.order.findUnique({ where: { id } });
}

// Use 1 query
const orders = await db.order.findMany({
  where: { id: { in: ids } }
});
```

### 3. Use Indexes
All critical indexes are already created. Check:
```sql
\d+ "Order"  -- View table structure and indexes
```

## Emergency Procedures

### If Connection Pool Exhausted

1. **Stop all running processes:**
   ```bash
   pkill -9 -f "tsx"
   pkill -9 -f "node"
   ```

2. **Wait 30 seconds** for connections to close

3. **Restart app:**
   ```bash
   npm run dev
   ```

### If Database Unreachable

1. **Check Neon status:**
   - Visit https://console.neon.tech
   - Check if database is active

2. **Verify connection string:**
   ```bash
   cat .env | grep DATABASE_URL_NEON
   ```

3. **Test connection:**
   ```bash
   npx tsx sync-to-neon.ts --verify-only
   ```

## Support

**Connection issues?**
1. Check this guide first
2. Review [NEON_DEPLOYMENT_GUIDE.md](NEON_DEPLOYMENT_GUIDE.md)
3. Check Neon status page: https://neonstatus.com
4. Contact Neon support (if on paid plan)

**Performance issues?**
1. Enable Redis caching
2. Review slow query logs in Neon dashboard
3. Check [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for optimization tips

---

## Summary

✅ **Connection optimized with:**
- PgBouncer connection pooling
- 30-second timeouts (development)
- 5 connection limit (prevents exhaustion)

✅ **Best practices implemented:**
- Singleton Prisma client
- Proper connection management
- Batch processing for large operations

✅ **Your setup is production-ready!**

Need more help? Check the main [NEON_DEPLOYMENT_GUIDE.md](NEON_DEPLOYMENT_GUIDE.md) for comprehensive troubleshooting.
