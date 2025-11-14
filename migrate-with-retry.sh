#!/bin/bash

# Script to retry Prisma migrations with advisory lock handling for Neon

echo "🔄 Attempting Prisma migration with retry logic..."

# Try up to 5 times with increasing delays
for i in {1..5}; do
  echo ""
  echo "Attempt $i of 5..."

  if npx prisma migrate deploy; then
    echo "✅ Migration successful!"
    exit 0
  else
    if [ $i -lt 5 ]; then
      wait_time=$((i * 5))
      echo "⏳ Migration failed. Waiting ${wait_time} seconds before retry..."
      sleep $wait_time
    fi
  fi
done

echo ""
echo "❌ Migration failed after 5 attempts."
echo ""
echo "This is likely due to Neon connection pooling holding advisory locks."
echo "Solutions:"
echo "  1. Wait a few minutes for Neon to auto-terminate idle connections"
echo "  2. Restart your Neon database from the Neon console"
echo "  3. Use 'npx prisma db push' instead (skips migration system)"
exit 1
