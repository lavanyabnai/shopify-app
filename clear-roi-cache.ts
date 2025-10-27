/**
 * Clear ROI Cache
 *
 * Clears all ROI-related cache entries
 */

import cache from "./app/services/cache.server";

async function clearCache() {
  try {
    console.log("🧹 Clearing ROI cache...");

    // Clear all war-room related cache keys
    const patterns = [
      "war-room:roi:*",
      "war-room:attribution:*",
    ];

    for (const pattern of patterns) {
      try {
        await cache.client.del(pattern);
        console.log(`✅ Cleared cache pattern: ${pattern}`);
      } catch (error) {
        console.log(`⚠️  Could not clear ${pattern} - cache might not be available`);
      }
    }

    console.log("\n✅ Cache cleared successfully!");
    console.log("The next page load will fetch fresh data from the database.");

  } catch (error) {
    console.log("⚠️  Redis not available or error clearing cache:", error);
    console.log("This is OK - the app will work without Redis caching.");
  } finally {
    await cache.disconnect();
  }
}

clearCache();
