# Redis Caching - Production Deployment Guide

This guide covers deploying the Shopify analytics app with Redis caching enabled for optimal performance.

## Overview

**Performance Improvement:**
- **Without Redis:** 30-60 seconds (Session #1 baseline)
- **With Database Optimization:** <2 seconds (Session #5)
- **With Redis Caching:** <500ms on cache hit (Session #6)

**Architecture:**
- Redis caches pre-computed analytics data
- 5-minute TTL (Time To Live)
- Automatic cache invalidation on webhook events
- Graceful fallback if Redis is unavailable

---

## Local Development Setup

### 1. Install Redis Locally

**macOS (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**Windows (using WSL2):**
```bash
sudo apt install redis-server
sudo service redis-server start
```

**Docker (cross-platform):**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

### 2. Configure Environment Variables

Add to your `.env` file:

```env
# Redis Configuration (optional - defaults to localhost:6379)
REDIS_URL=redis://localhost:6379

# Or with password:
# REDIS_URL=redis://:your_password@localhost:6379

# Or with TLS (production):
# REDIS_URL=rediss://username:password@your-redis-host:6380
```

### 3. Test Redis Connection

Start your development server:

```bash
npm run dev
```

Check console logs for:
```
✅ Redis connected
```

If Redis is not available, you'll see:
```
⚠️ Redis unavailable, cache miss: v1:analytics:snapshot:your-shop.myshopify.com
```

The app will work normally, just without caching.

---

## Production Deployment

### Option 1: Heroku

#### Install Redis Add-on

```bash
# Heroku Redis (recommended)
heroku addons:create heroku-redis:mini -a your-app-name

# Or Redis Enterprise Cloud
heroku addons:create rediscloud:30 -a your-app-name
```

The `REDIS_URL` environment variable will be automatically set.

#### Verify Configuration

```bash
heroku config:get REDIS_URL -a your-app-name
```

Should output something like:
```
redis://h:password@ec2-xxx.compute-1.amazonaws.com:1234
```

### Option 2: Fly.io

#### Create Redis Instance

```bash
# Create Upstash Redis (free tier available)
fly redis create your-app-redis

# This will output connection details
```

#### Set Environment Variable

```bash
fly secrets set REDIS_URL="redis://default:password@fly-redis-host.upstash.io:6379" -a your-app-name
```

#### Deploy

```bash
fly deploy
```

### Option 3: Railway

#### Add Redis Service

1. Go to your Railway project
2. Click "New" → "Database" → "Redis"
3. Railway will automatically create `REDIS_URL` variable
4. Redeploy your app

```bash
railway up
```

### Option 4: Vercel (with Upstash Redis)

#### Create Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the `REDIS_URL` connection string

#### Configure Vercel Environment Variables

```bash
vercel env add REDIS_URL
# Paste your Upstash Redis URL when prompted
```

Or add via Vercel Dashboard:
- Settings → Environment Variables
- Add `REDIS_URL` with your connection string

### Option 5: AWS (EC2 + ElastiCache)

#### Create ElastiCache Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id shopify-analytics-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

#### Get Connection Endpoint

```bash
aws elasticache describe-cache-clusters \
  --cache-cluster-id shopify-analytics-cache \
  --show-cache-node-info
```

#### Set Environment Variable

```bash
export REDIS_URL="redis://your-elasticache-endpoint:6379"
```

### Option 6: Self-Hosted Redis

#### Install Redis on Server

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Configure for production
sudo nano /etc/redis/redis.conf
```

**Production Configuration:**

```conf
# Bind to localhost and private IP
bind 127.0.0.1 10.0.0.5

# Enable password authentication
requirepass your_strong_password_here

# Enable persistence
appendonly yes
appendfilename "appendonly.aof"

# Memory limits
maxmemory 256mb
maxmemory-policy allkeys-lru

# Security
protected-mode yes
```

Restart Redis:
```bash
sudo systemctl restart redis
```

#### Connect from App

```env
REDIS_URL=redis://:your_strong_password_here@your-server-ip:6379
```

---

## Environment Variables Reference

### Required Variables

None! Redis is **optional**. The app works without it (just slower).

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` | `redis://:pass@host:6379` |

### Redis URL Format

```
redis://[username]:[password]@[host]:[port]/[database]
```

**Examples:**

```bash
# Local development (no auth)
REDIS_URL=redis://localhost:6379

# Production with password
REDIS_URL=redis://:MyStrongPassword123@redis.example.com:6379

# TLS connection (Upstash, Heroku, etc.)
REDIS_URL=rediss://default:password@fly-redis.upstash.io:6380

# With username and password
REDIS_URL=redis://admin:secret@10.0.0.5:6379/0
```

---

## Performance Tuning

### Cache TTL Configuration

Edit `app/services/cache.server.ts`:

```typescript
// Current: 5 minutes (300 seconds)
const DEFAULT_TTL = 300;

// For frequently changing data: 1 minute
const DEFAULT_TTL = 60;

// For stable data: 15 minutes
const DEFAULT_TTL = 900;
```

### Memory Usage

Monitor Redis memory usage:

```bash
redis-cli INFO memory
```

Set memory limit in Redis config:

```conf
maxmemory 512mb
maxmemory-policy allkeys-lru  # Evict least recently used keys
```

### Connection Pooling

The cache service automatically handles connection pooling. Adjust timeouts if needed:

Edit `app/services/cache.server.ts`:

```typescript
socket: {
  connectTimeout: 5000,  // Increase for slow networks
  reconnectStrategy: (retries) => {
    if (retries > 5) {  // Try more times before giving up
      return new Error('Redis reconnection limit reached');
    }
    return Math.min(retries * 100, 3000);
  },
}
```

---

## Monitoring & Debugging

### Check Redis Connection

```bash
# Local
redis-cli ping
# Should return: PONG

# Remote
redis-cli -h your-host -p 6379 -a your-password ping
```

### View Cached Keys

```bash
redis-cli KEYS "v1:analytics:*"
```

### Get Cache Statistics

View hit/miss ratio in your app logs:

```
📬 Cache hit: v1:analytics:snapshot:shop.myshopify.com (45ms)
📭 Cache miss: v1:analytics:snapshot:shop.myshopify.com (1250ms)
```

### Monitor Cache Performance

Add monitoring endpoint (optional):

Create `app/routes/app.cache-stats.tsx`:

```typescript
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import cache from "../services/cache.server";

export async function loader({ request }) {
  await authenticate.admin(request);
  const stats = await cache.getStats();
  return json(stats);
}
```

Access at `/app/cache-stats` to see:
- Connection status
- Hit rate
- Keyspace statistics

### Clear All Caches

```bash
# Development
redis-cli FLUSHDB

# Production (be careful!)
redis-cli -h your-host -a your-password FLUSHDB
```

Or programmatically:

```typescript
// In your app
await cache.invalidateShop(shop);
```

---

## Troubleshooting

### Problem: "Redis unavailable" in logs

**Solution:** The app is working correctly! Redis is optional. Install Redis or set `REDIS_URL` to enable caching.

### Problem: Connection timeout errors

**Solutions:**
1. Check firewall rules (Redis port 6379 must be open)
2. Verify Redis is running: `redis-cli ping`
3. Check `REDIS_URL` format
4. Increase connection timeout in `cache.server.ts`

### Problem: High memory usage

**Solutions:**
1. Reduce TTL to clear caches faster
2. Set `maxmemory` in Redis config
3. Use `allkeys-lru` eviction policy
4. Upgrade Redis instance size

### Problem: Cache not invalidating

**Check:**
1. Webhooks are being received (check webhook logs)
2. Cache invalidation code is running (check app logs for "🧹 Invalidated analytics cache")
3. Redis connection is working

**Force clear:**
```bash
redis-cli KEYS "v1:analytics:*" | xargs redis-cli DEL
```

### Problem: Slower than expected

**Checklist:**
- [ ] Redis is running on same network as app (low latency)
- [ ] Analytics snapshots are pre-computed (run `/app/compute-analytics`)
- [ ] Data is being synced from Shopify (run `/app/sync`)
- [ ] Check cache hit rate (should be >80% after warmup)

---

## Security Best Practices

### 1. Always Use Passwords in Production

```conf
# /etc/redis/redis.conf
requirepass YourVeryStrongPasswordHere123!
```

### 2. Use TLS for Remote Connections

```env
REDIS_URL=rediss://username:password@host:6380
```

Note the `rediss://` (with double 's') for TLS.

### 3. Restrict Network Access

```conf
# Only allow connections from app server
bind 127.0.0.1 10.0.0.5
```

Or use firewall rules:

```bash
# Ubuntu UFW
sudo ufw allow from 10.0.0.10 to any port 6379
```

### 4. Disable Dangerous Commands

```conf
# /etc/redis/redis.conf
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG ""
```

### 5. Enable Persistence

```conf
# Append-only file (most durable)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec

# Or RDB snapshots
save 900 1
save 300 10
save 60 10000
```

---

## Cost Optimization

### Free Tier Options

| Provider | Plan | Memory | Connections | Price |
|----------|------|--------|-------------|-------|
| Upstash | Free | 256 MB | 1000/day | $0 |
| Redis Cloud | Free | 30 MB | 30 | $0 |
| Railway | Trial | 512 MB | Unlimited | $0 (5hrs/mo) |

### Paid Options (Recommended for Production)

| Provider | Plan | Memory | Price/Month |
|----------|------|--------|-------------|
| Heroku Redis | Mini | 25 MB | $3 |
| Upstash | Pro | 1 GB | $10 |
| Redis Cloud | Standard | 1 GB | $15 |
| AWS ElastiCache | t3.micro | 1 GB | ~$13 |

### When to Skip Redis

Redis is optional if:
- You have <1000 orders
- Analytics dashboard is rarely accessed
- <2 second load time is acceptable
- Budget is very tight

The app works perfectly fine without Redis!

---

## Testing Checklist

Before deploying to production:

- [ ] Redis connection works (`redis-cli ping`)
- [ ] `REDIS_URL` environment variable is set
- [ ] App builds successfully (`npm run build`)
- [ ] Cache hit logs appear when loading analytics twice
- [ ] Cache invalidation works after webhook events
- [ ] App still works if Redis is stopped (graceful fallback)
- [ ] Load time <500ms on cache hit
- [ ] Load time <2s on cache miss
- [ ] Memory usage is reasonable (<100 MB for typical workload)

---

## Next Steps After Deployment

1. **Monitor performance:** Check analytics load time in production
2. **Test webhooks:** Trigger order/product events and verify cache invalidation
3. **Pre-compute analytics:** Run `/app/compute-analytics` for last 30 days
4. **Sync historical data:** Run `/app/sync` to populate database
5. **Monitor Redis memory:** Set up alerts for >80% memory usage
6. **Enable backups:** Configure Redis persistence for data durability

---

## Support & Resources

**Redis Documentation:**
- [Redis Official Docs](https://redis.io/docs/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)
- [Redis Security](https://redis.io/topics/security)

**Hosting Providers:**
- [Upstash Redis](https://upstash.com/)
- [Heroku Redis](https://elements.heroku.com/addons/heroku-redis)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)

**App Documentation:**
- See [SESSION_STATUS.md](SESSION_STATUS.md) for implementation details
- See [CLAUDE.md](CLAUDE.md) for architecture overview
- See [app/services/cache.server.ts](app/services/cache.server.ts) for cache implementation

---

## Quick Start Commands

```bash
# Development
docker run -d -p 6379:6379 redis:7-alpine
echo "REDIS_URL=redis://localhost:6379" >> .env
npm run dev

# Production (Heroku)
heroku addons:create heroku-redis:mini
heroku config
git push heroku main

# Production (Fly.io)
fly redis create my-redis
fly secrets set REDIS_URL="..."
fly deploy

# Test cache
curl -I https://your-app.com/app/analytics
# Look for: X-Cache: HIT or X-Cache: MISS
```

---

**Questions?** Check the logs for detailed Redis connection information and cache hit/miss stats.
