/**
 * Seed Competitive Intelligence Data (Session 6)
 *
 * Generates mock competitive intelligence data for demonstration.
 * In production, this would integrate with real market intelligence APIs.
 */

import {
  getCompetitiveIntelligence,
  analyzeCompetitivePosition,
  getMarketShareTrend,
} from "./app/services/competitive-intel.server";

const TEST_SHOP = "test-shop.myshopify.com";

async function seedCompetitiveData() {
  console.log("🌐 Generating Competitive Intelligence Data (Session 6)\n");
  console.log("=".repeat(60));

  try {
    // Generate competitive metrics
    console.log("\n📊 Test 1: Generate Competitive Metrics");
    console.log("-".repeat(60));
    const metrics = await getCompetitiveIntelligence(TEST_SHOP);
    console.log("✅ Competitive metrics generated");
    console.log(`   Market Share: ${metrics.marketShareEstimate}%`);
    console.log(`   Rank: #${metrics.rankInCategory} of ${metrics.totalCompetitors}`);
    console.log(`   Pricing Position: ${metrics.pricingPosition} (${metrics.priceAdvantage > 0 ? "+" : ""}${metrics.priceAdvantage.toFixed(1)}%)`);
    console.log(`   In-Stock Rate: ${metrics.inStockRate}%`);
    console.log(`   Competitor Stockout Rate: ${metrics.competitorStockoutRate}%`);
    console.log(
      `   Availability Advantage: ${(metrics.inStockRate - (100 - metrics.competitorStockoutRate)).toFixed(1)}%`
    );
    console.log(`   Availability Score: ${metrics.availabilityScore}/100`);

    // Display top categories
    console.log("\n🏆 Top Categories:");
    metrics.topCategories.forEach((cat) => {
      const trendIcon =
        cat.trend === "gaining" ? "📈" : cat.trend === "losing" ? "📉" : "➡️";
      console.log(`   ${trendIcon} ${cat.category}:`);
      console.log(`      Market Share: ${cat.marketShare}% (Rank #${cat.rank})`);
      console.log(`      Your Revenue: $${cat.yourRevenue.toLocaleString()}`);
      console.log(`      Market Revenue: $${cat.marketRevenue.toLocaleString()}`);
    });

    // Display emerging opportunities
    console.log("\n💡 Emerging Opportunities:");
    metrics.emergingOpportunities.forEach((opp) => {
      console.log(`   ${opp.title}`);
      console.log(`      Description: ${opp.description}`);
      console.log(
        `      Potential Revenue: $${opp.potentialRevenue.toLocaleString()} (${opp.confidence}% confidence)`
      );
      console.log(`      Action: ${opp.action}`);
    });

    // Display competitor profiles
    console.log("\n🎯 Competitor Profiles:");
    metrics.competitors.forEach((comp) => {
      console.log(`   ${comp.name}:`);
      console.log(`      Market Share: ${comp.marketShare}%`);
      console.log(`      Avg Price: $${comp.avgPrice}`);
      console.log(`      Stockout Rate: ${comp.stockoutRate}%`);
      console.log(`      Strength: ${comp.strength}`);
      console.log(`      Weakness: ${comp.weakness}`);
    });

    // Analyze competitive position
    console.log("\n🔍 Test 2: Analyze Competitive Position");
    console.log("-".repeat(60));
    const analysis = await analyzeCompetitivePosition(TEST_SHOP);
    console.log("✅ Competitive analysis generated");

    console.log(`\n   Insights (${analysis.insights.length}):`);
    analysis.insights.forEach((insight) => {
      console.log(`      ${insight}`);
    });

    console.log(`\n   Threats (${analysis.threats.length}):`);
    analysis.threats.forEach((threat) => {
      console.log(`      ${threat}`);
    });

    console.log(`\n   Opportunities (${analysis.opportunities.length}):`);
    analysis.opportunities.forEach((opp) => {
      console.log(`      ${opp}`);
    });

    // Get market share trend
    console.log("\n📈 Test 3: Get Market Share Trend");
    console.log("-".repeat(60));
    const trend = await getMarketShareTrend(TEST_SHOP);
    console.log("✅ Market share trend generated");
    console.log(`   Dates: ${trend.dates.length} days`);
    console.log(`   Your Share: ${trend.yourShare[0].toFixed(1)}% → ${trend.yourShare[trend.yourShare.length - 1].toFixed(1)}%`);
    console.log(`   Change: ${(trend.yourShare[trend.yourShare.length - 1] - trend.yourShare[0]).toFixed(1)}%`);

    console.log(`\n   Competitor Trends:`);
    trend.competitorShares.forEach((comp) => {
      const start = comp.data[0];
      const end = comp.data[comp.data.length - 1];
      const change = end - start;
      console.log(
        `      ${comp.name}: ${start.toFixed(1)}% → ${end.toFixed(1)}% (${change > 0 ? "+" : ""}${change.toFixed(1)}%)`
      );
    });

    // Test cache performance
    console.log("\n🗄️  Test 4: Test Cache Performance");
    console.log("-".repeat(60));
    const startTime = Date.now();
    await getCompetitiveIntelligence(TEST_SHOP);
    const loadTime = Date.now() - startTime;
    console.log(`✅ Cached metrics loaded in ${loadTime}ms`);
    console.log(`   Cache hit: ${loadTime < 50 ? "YES ✅" : "NO (first run) ⚠️"}`);

    // Overall result
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Competitive intelligence data seeded successfully!");
    console.log("=".repeat(60));

    // Summary statistics
    console.log("\n📊 Summary Statistics:");
    console.log(`   Market Share: ${metrics.marketShareEstimate}%`);
    console.log(`   Rank: #${metrics.rankInCategory} of ${metrics.totalCompetitors}`);
    console.log(`   Top Categories: ${metrics.topCategories.length}`);
    console.log(`   Opportunities: ${metrics.emergingOpportunities.length}`);
    console.log(`   Competitors: ${metrics.competitors.length}`);
    console.log(`   Cache working: ${loadTime < 50 ? "YES" : "NO (first run)"}`);
    console.log(`   Performance: ${loadTime}ms (target: <500ms)`);

    console.log("\n✨ Competitive Intelligence is ready for the War Room!\n");

    // Return success
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  }
}

// Run seed
seedCompetitiveData();
