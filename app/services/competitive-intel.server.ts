/**
 * BFCM War Room - Competitive Intelligence Service (Session 6)
 *
 * Provides competitive positioning metrics using mock data for demonstration.
 * In production, this would integrate with real market intelligence APIs.
 *
 * Features:
 * - Market share estimation
 * - Pricing position analysis
 * - Category domination tracking
 * - Availability advantage monitoring
 */

import cache, { getCacheKey } from "./cache.server";

// ============================================================================
// Types
// ============================================================================

export interface CompetitiveMetrics {
  // Market Position
  marketShareEstimate: number; // % of category revenue
  rankInCategory: number; // 1st, 2nd, 3rd, etc.
  totalCompetitors: number;

  // Pricing Position
  avgPrice: number; // Your average price
  competitorAvgPrice: number; // Market average
  pricingPosition: 'premium' | 'competitive' | 'value';
  priceAdvantage: number; // % difference from market avg

  // Availability Advantage
  inStockRate: number; // % of products available
  competitorStockoutRate: number; // % of competitor products out of stock
  availabilityScore: number; // 0-100 score

  // Category Performance
  topCategories: CategoryPerformance[];
  emergingOpportunities: Opportunity[];

  // Competitor Insights
  competitors: CompetitorProfile[];

  // Timestamps
  lastUpdated: string;
  calculationTime: number;
}

export interface CategoryPerformance {
  category: string;
  yourRevenue: number;
  marketRevenue: number;
  marketShare: number; // %
  rank: number;
  trend: 'gaining' | 'losing' | 'stable';
}

export interface Opportunity {
  title: string;
  description: string;
  potentialRevenue: number;
  confidence: number; // 0-100
  action: string; // Recommended action
}

export interface CompetitorProfile {
  name: string; // Anonymized (Competitor A, B, C)
  marketShare: number; // %
  avgPrice: number;
  stockoutRate: number; // %
  strength: string; // Their competitive advantage
  weakness: string; // Their vulnerability
}

// ============================================================================
// Mock Data Generation
// ============================================================================

/**
 * Generate mock competitive metrics for demonstration
 */
export async function getCompetitiveIntelligence(shop: string): Promise<CompetitiveMetrics> {
  const startTime = Date.now();
  const cacheKey = getCacheKey('war-room', 'competitive-intel', shop);

  console.log(`<� Generating competitive intelligence for ${shop}...`);

  // Try cache first (1 hour TTL)
  const cached = await cache.get<CompetitiveMetrics>(cacheKey);
  if (cached !== null) {
    console.log(` Competitive intelligence loaded from cache`);
    return cached;
  }

  // Generate fresh mock data
  const metrics: CompetitiveMetrics = {
    // Market Position (mock: you're #2 with 23% share)
    marketShareEstimate: 23.4,
    rankInCategory: 2,
    totalCompetitors: 12,

    // Pricing Position (mock: slightly premium)
    avgPrice: 49.99,
    competitorAvgPrice: 45.50,
    pricingPosition: 'premium',
    priceAdvantage: 9.9, // 9.9% above market avg

    // Availability Advantage (mock: you have better stock)
    inStockRate: 94.5,
    competitorStockoutRate: 18.3,
    availabilityScore: 87,

    // Category Performance
    topCategories: generateTopCategories(),

    // Emerging Opportunities
    emergingOpportunities: generateOpportunities(),

    // Competitor Profiles
    competitors: generateCompetitorProfiles(),

    // Timestamps
    lastUpdated: new Date().toISOString(),
    calculationTime: Date.now() - startTime,
  };

  // Cache for 1 hour
  await cache.set(cacheKey, metrics, 3600);

  const calculationTime = Date.now() - startTime;
  console.log(` Competitive intelligence generated in ${calculationTime}ms`);
  console.log(`   Market Share: ${metrics.marketShareEstimate}%`);
  console.log(`   Rank: #${metrics.rankInCategory} of ${metrics.totalCompetitors}`);
  console.log(`   Availability Advantage: ${(metrics.inStockRate - (100 - metrics.competitorStockoutRate)).toFixed(1)}%`);

  return metrics;
}

/**
 * Generate mock top category performance
 */
function generateTopCategories(): CategoryPerformance[] {
  return [
    {
      category: 'Electronics',
      yourRevenue: 125000,
      marketRevenue: 480000,
      marketShare: 26.0,
      rank: 1,
      trend: 'gaining',
    },
    {
      category: 'Home & Garden',
      yourRevenue: 89000,
      marketRevenue: 420000,
      marketShare: 21.2,
      rank: 2,
      trend: 'stable',
    },
    {
      category: 'Fashion',
      yourRevenue: 67000,
      marketRevenue: 390000,
      marketShare: 17.2,
      rank: 3,
      trend: 'losing',
    },
    {
      category: 'Sports & Outdoors',
      yourRevenue: 54000,
      marketRevenue: 280000,
      marketShare: 19.3,
      rank: 2,
      trend: 'gaining',
    },
    {
      category: 'Beauty & Personal Care',
      yourRevenue: 43000,
      marketRevenue: 310000,
      marketShare: 13.9,
      rank: 4,
      trend: 'stable',
    },
  ];
}

/**
 * Generate mock emerging opportunities
 */
function generateOpportunities(): Opportunity[] {
  return [
    {
      title: 'Capture Competitor A Stockouts',
      description: 'Competitor A has 34% stockout rate in Electronics. Increase your visibility when they\'re out of stock.',
      potentialRevenue: 45000,
      confidence: 82,
      action: 'Increase ad spend on Electronics by 25%',
    },
    {
      title: 'Price Opportunity in Home & Garden',
      description: 'Your prices are 15% below market average. Small price increase would maintain volume while improving margin.',
      potentialRevenue: 13000,
      confidence: 75,
      action: 'Test 8% price increase on top 20 SKUs',
    },
    {
      title: 'Bundle Strategy Against Competitor C',
      description: 'Competitor C doesn\'t offer bundles. Create value packs to differentiate and increase AOV.',
      potentialRevenue: 28000,
      confidence: 68,
      action: 'Create 3-5 bundle offers in top categories',
    },
    {
      title: 'Flash Sale During Competitor Downtime',
      description: 'Competitor B typically goes offline 2-4 AM EST for maintenance. Run flash sales during their downtime.',
      potentialRevenue: 12000,
      confidence: 91,
      action: 'Schedule 4-hour flash sale starting 2 AM',
    },
  ];
}

/**
 * Generate mock competitor profiles
 */
function generateCompetitorProfiles(): CompetitorProfile[] {
  return [
    {
      name: 'Competitor A',
      marketShare: 28.5,
      avgPrice: 52.99,
      stockoutRate: 34.2,
      strength: 'Brand recognition & premium positioning',
      weakness: 'Poor inventory management, frequent stockouts',
    },
    {
      name: 'Competitor B',
      marketShare: 18.7,
      avgPrice: 42.50,
      stockoutRate: 12.1,
      strength: 'Competitive pricing & good availability',
      weakness: 'Limited product variety, slow shipping',
    },
    {
      name: 'Competitor C',
      marketShare: 15.3,
      avgPrice: 48.25,
      stockoutRate: 8.5,
      strength: 'Fast shipping & excellent customer service',
      weakness: 'Higher prices, smaller market presence',
    },
    {
      name: 'Competitor D',
      marketShare: 8.2,
      avgPrice: 38.99,
      stockoutRate: 22.8,
      strength: 'Value pricing & aggressive promotions',
      weakness: 'Quality concerns, inconsistent availability',
    },
    {
      name: 'Others (8 competitors)',
      marketShare: 5.9,
      avgPrice: 44.75,
      stockoutRate: 25.4,
      strength: 'Niche specialization',
      weakness: 'Limited resources & reach',
    },
  ];
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze competitive position and generate insights
 */
export async function analyzeCompetitivePosition(shop: string): Promise<{
  metrics: CompetitiveMetrics;
  insights: string[];
  threats: string[];
  opportunities: string[];
}> {
  const cacheKey = getCacheKey('war-room', 'competitive-analysis', shop);

  // Try cache first
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  const metrics = await getCompetitiveIntelligence(shop);
  const analysis = {
    metrics,
    insights: generateInsights(metrics),
    threats: generateThreats(metrics),
    opportunities: generateOpportunityInsights(metrics),
  };

  // Cache for 1 hour
  await cache.set(cacheKey, analysis, 3600);

  return analysis;
}

/**
 * Generate competitive insights
 */
function generateInsights(metrics: CompetitiveMetrics): string[] {
  const insights: string[] = [];

  // Market position insights
  if (metrics.rankInCategory <= 3) {
    insights.push(`=� Strong market position: Ranked #${metrics.rankInCategory} with ${metrics.marketShareEstimate}% share`);
  }

  // Pricing insights
  if (metrics.pricingPosition === 'premium' && metrics.inStockRate > 90) {
    insights.push(`( Premium positioning supported by high availability (${metrics.inStockRate}%)`);
  }

  // Availability advantage
  const availabilityGap = metrics.inStockRate - (100 - metrics.competitorStockoutRate);
  if (availabilityGap > 10) {
    insights.push(`<� Significant availability advantage: ${availabilityGap.toFixed(1)}% better than market`);
  }

  // Category dominance
  const topCategory = metrics.topCategories[0];
  if (topCategory && topCategory.rank === 1) {
    insights.push(`=Q Category leader in ${topCategory.category} with ${topCategory.marketShare}% share`);
  }

  return insights;
}

/**
 * Generate competitive threats
 */
function generateThreats(metrics: CompetitiveMetrics): string[] {
  const threats: string[] = [];

  // Market leader threat
  const topCompetitor = metrics.competitors[0];
  if (topCompetitor && topCompetitor.marketShare > metrics.marketShareEstimate * 1.2) {
    threats.push(`� ${topCompetitor.name} has ${topCompetitor.marketShare}% share (${(topCompetitor.marketShare - metrics.marketShareEstimate).toFixed(1)}% ahead)`);
  }

  // Pricing pressure
  if (metrics.pricingPosition === 'premium' && metrics.priceAdvantage > 15) {
    threats.push(`� Pricing ${metrics.priceAdvantage.toFixed(1)}% above market may limit volume growth`);
  }

  // Category declining
  const decliningCategories = metrics.topCategories.filter(c => c.trend === 'losing');
  if (decliningCategories.length > 0) {
    threats.push(`=� Losing ground in ${decliningCategories.length} categories`);
  }

  // Low stock competitor recovering
  const recoveringCompetitors = metrics.competitors.filter(
    c => c.stockoutRate < 15 && c.marketShare > metrics.marketShareEstimate
  );
  if (recoveringCompetitors.length > 0) {
    threats.push(`� ${recoveringCompetitors.length} larger competitors have good availability`);
  }

  return threats;
}

/**
 * Generate opportunity insights
 */
function generateOpportunityInsights(metrics: CompetitiveMetrics): string[] {
  return metrics.emergingOpportunities
    .filter(o => o.confidence > 70)
    .map(o => `=� ${o.title}: ${o.description} (${o.confidence}% confidence)`);
}

/**
 * Get market share trend (mock data)
 */
export async function getMarketShareTrend(shop: string): Promise<{
  dates: string[];
  yourShare: number[];
  competitorShares: { name: string; data: number[] }[];
}> {
  const cacheKey = getCacheKey('war-room', 'market-share-trend', shop);

  // Try cache first
  const cached = await cache.get<any>(cacheKey);
  if (cached) {
    return cached;
  }

  // Generate mock trend data (last 7 days)
  const dates: string[] = [];
  const yourShare: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);

    // Mock: gradually increasing share
    yourShare.push(22.0 + i * 0.2 + Math.random() * 0.5);
  }

  const trend = {
    dates,
    yourShare,
    competitorShares: [
      {
        name: 'Competitor A',
        data: [29.5, 29.2, 28.9, 28.7, 28.5, 28.3, 28.5],
      },
      {
        name: 'Competitor B',
        data: [19.1, 19.0, 18.9, 18.8, 18.7, 18.7, 18.7],
      },
      {
        name: 'Competitor C',
        data: [15.8, 15.7, 15.5, 15.4, 15.3, 15.2, 15.3],
      },
    ],
  };

  // Cache for 1 hour
  await cache.set(cacheKey, trend, 3600);

  return trend;
}

/**
 * Invalidate competitive intelligence cache
 */
export async function invalidateCompetitiveCache(shop: string): Promise<void> {
  // Note: In production, this would be called when market data updates
  console.log(`=�  Competitive intelligence cache invalidated for ${shop}`);
}

