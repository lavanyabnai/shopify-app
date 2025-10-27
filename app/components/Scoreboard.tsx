/**
 * BFCM War Room - Scoreboard Component (Session 6)
 *
 * Displays real-time performance KPIs with comparisons to targets and prior year.
 * Shows competitive intelligence metrics and trend analysis.
 *
 * Features:
 * - Real-time KPI cards
 * - vs. Plan/Last Year comparisons
 * - Trend sparklines
 * - Competitive metrics
 * - Performance momentum indicators
 */

import {
  Card,
  Grid,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  Divider,
  Box,
} from "@shopify/polaris";
import type {
  PerformanceMetrics,
  Trend,
} from "../services/performance-tracker.server";
import type { CompetitiveMetrics } from "../services/competitive-intel.server";

// ============================================================================
// Main Scoreboard Component
// ============================================================================

interface ScoreboardProps {
  performanceMetrics: PerformanceMetrics;
  trends: Trend[];
  competitiveMetrics: CompetitiveMetrics;
}

export function Scoreboard({
  performanceMetrics,
  trends,
  competitiveMetrics,
}: ScoreboardProps) {
  // Handle undefined/null data gracefully
  if (!performanceMetrics || !competitiveMetrics) {
    return (
      <Card>
        <Box padding="400">
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              Performance Scoreboard
            </Text>
            <Text as="p" tone="subdued">
              Loading performance metrics...
            </Text>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  return (
    <BlockStack gap="400">
      {/* Performance KPIs Section */}
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text as="h2" variant="headingMd">
              Performance KPIs
            </Text>
            <Badge tone={getMomentumTone(performanceMetrics)}>
              {getMomentumLabel(performanceMetrics)}
            </Badge>
          </InlineStack>

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <KPICard
                title="Revenue"
                value={formatCurrency(performanceMetrics.dailyRevenue)}
                subtitle="Daily Run Rate"
                comparison={{
                  vsLastYear: performanceMetrics.vsLastYear,
                  vsPlan: performanceMetrics.vsPlan,
                }}
                trend={trends && trends.length > 0 ? trends.find((t) => t.metric === "revenue") : undefined}
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <KPICard
                title="Orders"
                value={performanceMetrics.totalOrders.toString()}
                subtitle={`${performanceMetrics.orderVelocity.toFixed(1)}/hour`}
                comparison={{
                  vsLastYear: calculateOrdersVsLastYear(performanceMetrics),
                }}
                trend={trends && trends.length > 0 ? trends.find((t) => t.metric === "orders") : undefined}
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <KPICard
                title="AOV"
                value={formatCurrency(performanceMetrics.avgOrderValue)}
                subtitle="Average Order Value"
                comparison={{
                  vsLastYear: 0, // Mock
                }}
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <KPICard
                title="Perfect Order Rate"
                value={`${performanceMetrics.perfectOrderRate.toFixed(1)}%`}
                subtitle="Fulfilled without issues"
                comparison={{
                  target: 95,
                  current: performanceMetrics.perfectOrderRate,
                }}
                tone={
                  performanceMetrics.perfectOrderRate >= 95
                    ? "success"
                    : performanceMetrics.perfectOrderRate >= 90
                      ? "warning"
                      : "critical"
                }
              />
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>

      {/* Inventory Efficiency Section */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Inventory Efficiency
          </Text>

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <MetricCard
                title="Inventory Turnover"
                value={performanceMetrics.inventoryTurnover.toFixed(2)}
                subtitle="Times per period"
                tone={
                  performanceMetrics.inventoryTurnover >= 3
                    ? "success"
                    : "attention"
                }
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <MetricCard
                title="Stockout Rate"
                value={`${performanceMetrics.stockoutRate.toFixed(1)}%`}
                subtitle="SKUs out of stock"
                tone={
                  performanceMetrics.stockoutRate <= 5
                    ? "success"
                    : performanceMetrics.stockoutRate <= 10
                      ? "warning"
                      : "critical"
                }
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <MetricCard
                title="Efficiency Score"
                value={`${performanceMetrics.inventoryEfficiency.toFixed(0)}%`}
                subtitle="Overall efficiency"
                tone={
                  performanceMetrics.inventoryEfficiency >= 80
                    ? "success"
                    : performanceMetrics.inventoryEfficiency >= 60
                      ? "attention"
                      : "warning"
                }
              />
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>

      {/* Competitive Intelligence Section */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Competitive Position
          </Text>

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <CompetitiveMetricCard
                title="Market Share"
                value={`${competitiveMetrics.marketShareEstimate.toFixed(1)}%`}
                subtitle={`Rank #${competitiveMetrics.rankInCategory} of ${competitiveMetrics.totalCompetitors}`}
                tone="info"
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <CompetitiveMetricCard
                title="Pricing Position"
                value={competitiveMetrics.pricingPosition}
                subtitle={`${competitiveMetrics.priceAdvantage > 0 ? "+" : ""}${competitiveMetrics.priceAdvantage.toFixed(1)}% vs market`}
                tone={
                  competitiveMetrics.pricingPosition === "premium"
                    ? "info"
                    : competitiveMetrics.pricingPosition === "competitive"
                      ? "success"
                      : "attention"
                }
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <CompetitiveMetricCard
                title="Availability Advantage"
                value={`${competitiveMetrics.availabilityScore}%`}
                subtitle={`${(competitiveMetrics.inStockRate - (100 - competitiveMetrics.competitorStockoutRate)).toFixed(1)}% better than market`}
                tone={competitiveMetrics.availabilityScore >= 80 ? "success" : "attention"}
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 3 }}>
              <CompetitiveMetricCard
                title="Top Category"
                value={competitiveMetrics.topCategories && competitiveMetrics.topCategories[0]?.category || "N/A"}
                subtitle={competitiveMetrics.topCategories && competitiveMetrics.topCategories[0] ? `${competitiveMetrics.topCategories[0].marketShare.toFixed(1)}% share` : "No data"}
                tone="info"
              />
            </Grid.Cell>
          </Grid>

          <Divider />

          {/* Top Competitors */}
          {competitiveMetrics.competitors && competitiveMetrics.competitors.length > 0 && (
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                Top Competitors
              </Text>
              {competitiveMetrics.competitors.slice(0, 3).map((competitor) => (
                <CompetitorCard key={competitor.name} competitor={competitor} />
              ))}
            </BlockStack>
          )}

          <Divider />
        </BlockStack>
      </Card>

      {/* Margin Protection */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Margin Protection
          </Text>

          <Grid>
            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <MetricCard
                title="Average Margin"
                value={`${performanceMetrics.avgMargin.toFixed(1)}%`}
                subtitle="Gross margin"
                tone="info"
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <MetricCard
                title="Margin Protected"
                value={formatCurrency(performanceMetrics.marginProtection)}
                subtitle="Avoided discounts"
                tone="success"
              />
            </Grid.Cell>

            <Grid.Cell columnSpan={{ xs: 6, md: 4 }}>
              <MetricCard
                title="Expedited Shipping"
                value={formatCurrency(performanceMetrics.expeditedShippingCost)}
                subtitle="Rush order costs"
                tone="attention"
              />
            </Grid.Cell>
          </Grid>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  comparison?: {
    vsLastYear?: number;
    vsPlan?: number;
    target?: number;
    current?: number;
  };
  trend?: Trend;
  tone?: "success" | "warning" | "critical" | "info";
}

function KPICard({
  title,
  value,
  subtitle,
  comparison,
  trend,
  tone,
}: KPICardProps) {
  return (
    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {title}
        </Text>

        <Text as="p" variant="heading2xl">
          {value}
        </Text>

        <Text as="p" variant="bodySm" tone="subdued">
          {subtitle}
        </Text>

        {comparison && (
          <BlockStack gap="100">
            {comparison.vsLastYear !== undefined && (
              <ComparisonBadge
                label="vs Last Year"
                value={comparison.vsLastYear}
              />
            )}
            {comparison.vsPlan !== undefined && (
              <ComparisonBadge label="vs Plan" value={comparison.vsPlan} />
            )}
            {comparison.target !== undefined && comparison.current !== undefined && (
              <ComparisonBadge
                label="vs Target"
                value={((comparison.current - comparison.target) / comparison.target) * 100}
              />
            )}
          </BlockStack>
        )}

        {trend && (
          <InlineStack gap="100" blockAlign="center">
            <TrendIndicator direction={trend.direction} />
            <Text as="p" variant="bodySm" tone="subdued">
              {Math.abs(trend.change).toFixed(1)}%
            </Text>
          </InlineStack>
        )}

        {tone && <Badge tone={tone}>{getToneLabel(tone)}</Badge>}
      </BlockStack>
    </Box>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  tone?: "success" | "attention" | "warning" | "critical" | "info";
}

function MetricCard({ title, value, subtitle, tone = "info" }: MetricCardProps) {
  return (
    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
      <BlockStack gap="200">
        <Text as="p" variant="bodySm" tone="subdued">
          {title}
        </Text>

        <InlineStack gap="200" blockAlign="center">
          <Text as="p" variant="headingLg">
            {value}
          </Text>
          <Badge tone={tone}>{getMetricStatus(tone)}</Badge>
        </InlineStack>

        <Text as="p" variant="bodySm" tone="subdued">
          {subtitle}
        </Text>
      </BlockStack>
    </Box>
  );
}

interface CompetitiveMetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  tone: "success" | "attention" | "warning" | "info";
}

function CompetitiveMetricCard({
  title,
  value,
  subtitle,
  tone,
}: CompetitiveMetricCardProps) {
  return (
    <Box padding="400" background="bg-surface-secondary" borderRadius="200">
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" variant="bodySm" tone="subdued">
            {title}
          </Text>
          <Badge tone={tone}>
            {tone === "success" ? "Strong" : tone === "attention" ? "Monitor" : "Improving"}
          </Badge>
        </InlineStack>

        <Text as="p" variant="headingLg">
          {value}
        </Text>

        <Text as="p" variant="bodySm" tone="subdued">
          {subtitle}
        </Text>
      </BlockStack>
    </Box>
  );
}

interface CompetitorCardProps {
  competitor: {
    name: string;
    marketShare: number;
    avgPrice: number;
    stockoutRate: number;
    strength: string;
    weakness: string;
  };
}

function CompetitorCard({ competitor }: CompetitorCardProps) {
  return (
    <Box padding="300" background="bg-surface-secondary" borderRadius="200">
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="center">
          <Text as="p" variant="bodyMd" fontWeight="semibold">
            {competitor.name}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            {competitor.marketShare.toFixed(1)}% share
          </Text>
        </InlineStack>

        <Grid>
          <Grid.Cell columnSpan={{ xs: 6 }}>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Avg Price
              </Text>
              <Text as="p" variant="bodySm">
                {formatCurrency(competitor.avgPrice)}
              </Text>
            </BlockStack>
          </Grid.Cell>

          <Grid.Cell columnSpan={{ xs: 6 }}>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" tone="subdued">
                Stockout Rate
              </Text>
              <Text as="p" variant="bodySm">
                {competitor.stockoutRate.toFixed(1)}%
              </Text>
            </BlockStack>
          </Grid.Cell>
        </Grid>

        <Divider />

        <BlockStack gap="100">
          <Text as="p" variant="bodySm">
            <Text as="span" fontWeight="semibold">Strength:</Text> {competitor.strength}
          </Text>
          <Text as="p" variant="bodySm">
            <Text as="span" fontWeight="semibold">Weakness:</Text> {competitor.weakness}
          </Text>
        </BlockStack>
      </BlockStack>
    </Box>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

interface ComparisonBadgeProps {
  label: string;
  value: number;
}

function ComparisonBadge({ label, value }: ComparisonBadgeProps) {
  const tone =
    value >= 10 ? "success" : value >= 0 ? "info" : value >= -10 ? "attention" : "critical";

  const prefix = value > 0 ? "+" : "";

  return (
    <InlineStack gap="100" blockAlign="center">
      <Text as="span" variant="bodySm" tone="subdued">
        {label}:
      </Text>
      <Badge tone={tone}>
        {prefix}
        {value.toFixed(1)}%
      </Badge>
    </InlineStack>
  );
}

interface TrendIndicatorProps {
  direction: "up" | "down" | "flat";
}

function TrendIndicator({ direction }: TrendIndicatorProps) {
  if (direction === "up") {
    return <Text tone="success">↗</Text>;
  }
  if (direction === "down") {
    return <Text tone="critical">↘</Text>;
  }
  return <Text tone="subdued">→</Text>;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getMomentumTone(metrics: PerformanceMetrics | null | undefined): "success" | "attention" | "warning" {
  if (!metrics || metrics.vsLastYear === undefined) return "attention";
  if (metrics.vsLastYear >= 10) return "success";
  if (metrics.vsLastYear >= 0) return "attention";
  return "warning";
}

function getMomentumLabel(metrics: PerformanceMetrics | null | undefined): string {
  if (!metrics || metrics.vsLastYear === undefined) return "➡️ Steady";
  if (metrics.vsLastYear >= 20) return "🚀 Accelerating";
  if (metrics.vsLastYear >= 10) return "📈 Growing";
  if (metrics.vsLastYear >= 0) return "➡️ Steady";
  if (metrics.vsLastYear >= -10) return "📉 Slowing";
  return "⚠️ Declining";
}

function calculateOrdersVsLastYear(metrics: PerformanceMetrics | null | undefined): number {
  // Mock calculation - would need historical data
  if (!metrics || metrics.vsLastYear === undefined) return 0;
  return metrics.vsLastYear * 0.9; // Assume orders trend similar to revenue
}

function getToneLabel(tone: string): string {
  const labels: Record<string, string> = {
    success: "Excellent",
    warning: "Needs Attention",
    critical: "Critical",
    info: "Normal",
  };
  return labels[tone] || "Normal";
}

function getMetricStatus(tone: string): string {
  const statuses: Record<string, string> = {
    success: "Healthy",
    attention: "Monitor",
    warning: "Action Needed",
    critical: "Critical",
    info: "Normal",
  };
  return statuses[tone] || "Normal";
}
