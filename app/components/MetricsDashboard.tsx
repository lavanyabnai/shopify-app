/**
 * Metrics Dashboard Component
 *
 * Displays mission-critical inventory metrics:
 * - Revenue at risk (24h/48h/72h windows)
 * - Top 10 at-risk products table
 * - Velocity anomaly alerts
 * - Fulfillment capacity indicators
 */

import {
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Badge,
  DataTable,
  InlineStack,
  Icon,
  ProgressBar,
} from "@shopify/polaris";
import {
  AlertCircleIcon,
  CashDollarIcon,
  TrendUpIcon,
  TrendDownIcon,
  PackageIcon,
} from "@shopify/polaris-icons";

// TypeScript interfaces
export interface RevenueRiskData {
  "24h": {
    totalRisk: number;
    expectedLoss: number;
    affectedSKUs: number;
    probability: number;
  };
  "48h": {
    totalRisk: number;
    expectedLoss: number;
    affectedSKUs: number;
    probability: number;
  };
  "72h": {
    totalRisk: number;
    expectedLoss: number;
    affectedSKUs: number;
    probability: number;
  };
}

export interface TopAtRiskProduct {
  rank: number;
  sku: string;
  productTitle: string;
  hoursUntilStockout: number;
  revenueAtRisk: number;
  currentStock: number;
  burnRate: number;
  location: string;
  urgency: "critical" | "high" | "medium" | "low";
}

export interface VelocitySummary {
  totalAnomalies: number;
  criticalAnomalies: number;
  highAnomalies: number;
  viralProducts: number;
  acceleratingProducts: number;
  deadStockProducts: number;
  categorySurges: number;
  topAnomalies: Array<{
    type: "viral" | "accelerating" | "dead_stock" | "category_surge";
    severity: "critical" | "high" | "medium" | "low";
    productTitle: string;
    percentChange: number;
    impact: string;
    recommendation: string;
  }>;
}

interface MetricsDashboardProps {
  revenueRisk: RevenueRiskData;
  topAtRiskProducts: TopAtRiskProduct[];
  velocitySummary: VelocitySummary;
}

/**
 * Revenue At Risk Cards Component
 */
function RevenueAtRiskCards({ revenueRisk }: { revenueRisk: RevenueRiskData }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCardTone = (probability: number): "critical" | "warning" | "info" => {
    if (probability > 0.7) return "critical";
    if (probability > 0.5) return "warning";
    return "info";
  };

  const windows = [
    { key: "24h" as const, label: "24 Hours", icon: "⚡" },
    { key: "48h" as const, label: "48 Hours", icon: "📊" },
    { key: "72h" as const, label: "72 Hours", icon: "📅" },
  ];

  return (
    <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
      {windows.map((window) => {
        const data = revenueRisk[window.key];
        const tone = getCardTone(data.probability);

        return (
          <Card key={window.key}>
            <Box padding="400">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingMd" as="h3">
                    {window.icon} {window.label}
                  </Text>
                  <Badge tone={tone}>
                    {(data.probability * 100).toFixed(0)}% risk
                  </Badge>
                </InlineStack>

                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued" as="span">
                    Revenue at Risk
                  </Text>
                  <Text variant="heading2xl" as="p">
                    {formatCurrency(data.totalRisk)}
                  </Text>
                </BlockStack>

                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodySm" tone="subdued" as="span">
                      Expected Loss
                    </Text>
                    <Text variant="bodyMd" fontWeight="semibold" as="span" tone={tone === "critical" ? "critical" : undefined}>
                      {formatCurrency(data.expectedLoss)}
                    </Text>
                  </InlineStack>
                  <ProgressBar
                    progress={(data.expectedLoss / data.totalRisk) * 100}
                    size="small"
                    tone={tone}
                  />
                </BlockStack>

                <Text variant="bodySm" tone="subdued" as="p">
                  {data.affectedSKUs} SKUs affected
                </Text>
              </BlockStack>
            </Box>
          </Card>
        );
      })}
    </InlineGrid>
  );
}

/**
 * Top At-Risk Products Table Component
 */
function TopAtRiskProductsTable({
  products,
}: {
  products: TopAtRiskProduct[];
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getUrgencyBadge = (urgency: string) => {
    const toneMap: Record<string, "critical" | "warning" | "attention" | "info"> = {
      critical: "critical",
      high: "warning",
      medium: "attention",
      low: "info",
    };

    return (
      <Badge tone={toneMap[urgency] || "info"}>
        {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
      </Badge>
    );
  };

  const rows = products.map((product) => [
    product.rank.toString(),
    product.sku,
    <Box maxWidth="200px">
      <Text variant="bodyMd" as="span" truncate>
        {product.productTitle}
      </Text>
    </Box>,
    `${product.hoursUntilStockout.toFixed(1)}h`,
    formatCurrency(product.revenueAtRisk),
    product.currentStock.toString(),
    `${product.burnRate.toFixed(1)}/h`,
    product.location,
    getUrgencyBadge(product.urgency),
  ]);

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h3">
              🎯 Top 10 At-Risk Products
            </Text>
            <Badge tone="info">{products.length} products</Badge>
          </InlineStack>

          {products.length === 0 ? (
            <Box padding="400">
              <Text variant="bodyMd" tone="subdued" as="p" alignment="center">
                No products currently at risk. All inventory levels are healthy!
              </Text>
            </Box>
          ) : (
            <DataTable
              columnContentTypes={[
                "text",
                "text",
                "text",
                "text",
                "numeric",
                "numeric",
                "text",
                "text",
                "text",
              ]}
              headings={[
                "#",
                "SKU",
                "Product",
                "Coverage",
                "Revenue Risk",
                "Stock",
                "Burn Rate",
                "Location",
                "Urgency",
              ]}
              rows={rows}
              hoverable
            />
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Velocity Anomalies Component
 */
function VelocityAnomaliesPanel({
  velocitySummary,
}: {
  velocitySummary: VelocitySummary;
}) {
  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case "viral":
        return "🔥";
      case "accelerating":
        return "⚡";
      case "dead_stock":
        return "📦";
      case "category_surge":
        return "📈";
      default:
        return "⚠️";
    }
  };

  const getAnomalyColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "critical";
      case "high":
        return "warning";
      case "medium":
        return "attention";
      default:
        return "info";
    }
  };

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Text variant="headingMd" as="h3">
              ⚡ Velocity Anomalies
            </Text>
            <Badge tone={velocitySummary.criticalAnomalies > 0 ? "critical" : "info"}>
              {velocitySummary.totalAnomalies} detected
            </Badge>
          </InlineStack>

          {/* Summary stats */}
          <InlineGrid columns={{ xs: 2, md: 4 }} gap="400">
            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued" as="span">
                    Viral Products
                  </Text>
                  <Text variant="headingLg" as="h4" tone="critical">
                    {velocitySummary.viralProducts}
                  </Text>
                  <Text variant="bodySm" as="span">300%+ surge</Text>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued" as="span">
                    Accelerating
                  </Text>
                  <Text variant="headingLg" as="h4">
                    {velocitySummary.acceleratingProducts}
                  </Text>
                  <Text variant="bodySm" as="span">100%+ increase</Text>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued" as="span">
                    Dead Stock
                  </Text>
                  <Text variant="headingLg" as="h4">
                    {velocitySummary.deadStockProducts}
                  </Text>
                  <Text variant="bodySm" as="span">&lt;10% expected</Text>
                </BlockStack>
              </Box>
            </Card>

            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued" as="span">
                    Category Surges
                  </Text>
                  <Text variant="headingLg" as="h4">
                    {velocitySummary.categorySurges}
                  </Text>
                  <Text variant="bodySm" as="span">Multi-SKU trend</Text>
                </BlockStack>
              </Box>
            </Card>
          </InlineGrid>

          {/* Top anomalies list */}
          {velocitySummary.topAnomalies.length > 0 && (
            <BlockStack gap="300">
              <Text variant="bodyMd" fontWeight="semibold" as="span">
                Top Anomalies:
              </Text>
              {velocitySummary.topAnomalies.map((anomaly, index) => (
                <Card key={index}>
                  <Box padding="300">
                    <BlockStack gap="200">
                      <InlineStack align="space-between" blockAlign="center">
                        <InlineStack gap="200" blockAlign="center">
                          <Text variant="bodyMd" as="span">
                            {getAnomalyIcon(anomaly.type)}
                          </Text>
                          <Text variant="bodyMd" fontWeight="semibold" as="span">
                            {anomaly.productTitle}
                          </Text>
                        </InlineStack>
                        <Badge tone={getAnomalyColor(anomaly.severity) as any}>
                          {anomaly.percentChange > 0 ? "+" : ""}
                          {anomaly.percentChange.toFixed(0)}%
                        </Badge>
                      </InlineStack>
                      <Text variant="bodySm" as="p">
                        {anomaly.impact}
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        💡 {anomaly.recommendation}
                      </Text>
                    </BlockStack>
                  </Box>
                </Card>
              ))}
            </BlockStack>
          )}

          {velocitySummary.totalAnomalies === 0 && (
            <Box padding="400">
              <Text variant="bodyMd" tone="subdued" as="p" alignment="center">
                No velocity anomalies detected. Sales patterns are within normal ranges.
              </Text>
            </Box>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Main Metrics Dashboard Component
 */
export default function MetricsDashboard({
  revenueRisk,
  topAtRiskProducts,
  velocitySummary,
}: MetricsDashboardProps) {
  return (
    <BlockStack gap="500">
      {/* Revenue at Risk Cards */}
      <BlockStack gap="300">
        <Text variant="headingLg" as="h2">
          💰 Revenue at Risk
        </Text>
        <RevenueAtRiskCards revenueRisk={revenueRisk} />
      </BlockStack>

      {/* Top At-Risk Products Table */}
      <TopAtRiskProductsTable products={topAtRiskProducts} />

      {/* Velocity Anomalies */}
      <VelocityAnomaliesPanel velocitySummary={velocitySummary} />

      {/* Fulfillment Capacity Placeholder (Session 2 extension) */}
      <Card>
        <Box padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h3">
              📦 Fulfillment Capacity
            </Text>
            <Text variant="bodyMd" tone="subdued" as="p">
              Real-time fulfillment capacity metrics and warehouse utilization will appear here in a future update.
            </Text>
          </BlockStack>
        </Box>
      </Card>
    </BlockStack>
  );
}
