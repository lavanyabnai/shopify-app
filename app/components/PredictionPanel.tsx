/**
 * Prediction Panel Component
 *
 * Displays ML-powered demand forecasts and stockout countdowns:
 * - 4-hour tactical predictions (immediate action needed)
 * - 24-hour operational forecasts (next-day planning)
 * - 72-hour strategic forecasts (supplier orders)
 * - Real-time countdown timers
 * - Confidence intervals and scenario visualization
 */

import {
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Badge,
  InlineStack,
  DataTable,
  ProgressBar,
  Icon,
} from "@shopify/polaris";
import {
  ClockIcon,
  AlertCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@shopify/polaris-icons";

interface PredictionPanelProps {
  predictions: any;
  countdowns: any;
}

export default function PredictionPanel({
  predictions,
  countdowns,
}: PredictionPanelProps) {
  if (!predictions || !countdowns) {
    return (
      <Card>
        <Box padding="400">
          <BlockStack gap="300">
            <Text variant="headingMd" as="h2">
              📊 Predictive Intelligence
            </Text>
            <Text variant="bodyMd" tone="subdued" as="p">
              No prediction data available. Generate forecasts to see predictions.
            </Text>
          </BlockStack>
        </Box>
      </Card>
    );
  }

  return (
    <BlockStack gap="400">
      {/* Summary Cards */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              📊 Predictive Intelligence
            </Text>

            <InlineGrid columns={4} gap="400">
              {/* Critical SKUs */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Critical (&lt;4h)
                    </Text>
                    <Icon source={AlertCircleIcon} tone="critical" />
                  </InlineStack>
                  <Text variant="heading2xl" as="h3" tone="critical">
                    {countdowns.criticalCount || 0}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    Immediate action needed
                  </Text>
                </BlockStack>
              </Box>

              {/* Urgent SKUs */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Urgent (4-12h)
                    </Text>
                    <Icon source={ClockIcon} tone="warning" />
                  </InlineStack>
                  <Text variant="heading2xl" as="h3">
                    {countdowns.urgentCount || 0}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    Plan restocking today
                  </Text>
                </BlockStack>
              </Box>

              {/* Warning SKUs */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Warning (12-24h)
                    </Text>
                    <Icon source={ClockIcon} tone="attention" />
                  </InlineStack>
                  <Text variant="heading2xl" as="h3">
                    {countdowns.warningCount || 0}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    Monitor closely
                  </Text>
                </BlockStack>
              </Box>

              {/* Watch SKUs */}
              <Box>
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Watch (24-72h)
                    </Text>
                    <Icon source={ClockIcon} tone="info" />
                  </InlineStack>
                  <Text variant="heading2xl" as="h3">
                    {countdowns.watchCount || 0}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    Strategic planning
                  </Text>
                </BlockStack>
              </Box>
            </InlineGrid>
          </BlockStack>
        </Box>
      </Card>

      {/* Stockout Countdown Timers */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">
                ⏱️ Stockout Countdown - Critical & Urgent
              </Text>
              <Badge tone="info">
                Live Updates
              </Badge>
            </InlineStack>

            {countdowns.topCritical && countdowns.topCritical.length > 0 ? (
              <StockoutCountdownTable countdowns={countdowns.topCritical} />
            ) : (
              <Text variant="bodyMd" tone="subdued" as="p">
                No critical stockouts predicted in the next 12 hours. All inventory levels healthy!
              </Text>
            )}
          </BlockStack>
        </Box>
      </Card>

      {/* 4-Hour Tactical Forecasts */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">
                🚀 4-Hour Tactical Forecast
              </Text>
              <Badge tone="attention">High Priority</Badge>
            </InlineStack>

            <Text variant="bodyMd" tone="subdued" as="p">
              Immediate demand predictions for restocking decisions in the next 4 hours.
            </Text>

            {predictions.top10Critical && predictions.top10Critical.length > 0 ? (
              <ForecastScenarioTable
                predictions={predictions.top10Critical}
                horizon="4h"
              />
            ) : (
              <Text variant="bodyMd" tone="subdued" as="p">
                No high-risk products identified for the next 4 hours.
              </Text>
            )}
          </BlockStack>
        </Box>
      </Card>

      {/* 24-Hour Operational Forecasts */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">
                📅 24-Hour Operational Forecast
              </Text>
              <Badge tone="info">Next Day Planning</Badge>
            </InlineStack>

            <Text variant="bodyMd" tone="subdued" as="p">
              Tomorrow's expected demand with best/likely/worst scenarios.
            </Text>

            {predictions.top10Critical && predictions.top10Critical.length > 0 ? (
              <ForecastScenarioTable
                predictions={predictions.top10Critical}
                horizon="24h"
              />
            ) : (
              <Text variant="bodyMd" tone="subdued" as="p">
                No significant demand forecasted for the next 24 hours.
              </Text>
            )}
          </BlockStack>
        </Box>
      </Card>

      {/* 72-Hour Strategic Forecasts */}
      <Card>
        <Box padding="400">
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">
                🎯 72-Hour Strategic Forecast
              </Text>
              <Badge>Supplier Orders</Badge>
            </InlineStack>

            <Text variant="bodyMd" tone="subdued" as="p">
              3-day forecast for strategic reordering and supplier planning.
            </Text>

            {predictions.top10Critical && predictions.top10Critical.length > 0 ? (
              <ForecastScenarioTable
                predictions={predictions.top10Critical}
                horizon="72h"
              />
            ) : (
              <Text variant="bodyMd" tone="subdued" as="p">
                Inventory levels healthy for the next 72 hours.
              </Text>
            )}
          </BlockStack>
        </Box>
      </Card>

      {/* Category-Level Forecasts */}
      {predictions.categoryForecasts && predictions.categoryForecasts.length > 0 && (
        <Card>
          <Box padding="400">
            <BlockStack gap="400">
              <Text variant="headingMd" as="h2">
                📈 Category Performance Forecast
              </Text>

              <CategoryForecastTable categories={predictions.categoryForecasts} />
            </BlockStack>
          </Box>
        </Card>
      )}
    </BlockStack>
  );
}

/**
 * Stockout Countdown Table Component
 */
function StockoutCountdownTable({ countdowns }: { countdowns: any[] }) {
  const rows = countdowns.slice(0, 10).map((countdown: any) => {
    const statusBadge = (
      <Badge tone={getCountdownBadgeTone(countdown.status)}>
        {countdown.status}
      </Badge>
    );

    const countdownDisplay = formatCountdownTime(countdown);

    return [
      <Text variant="bodyMd" fontWeight="semibold" as="span">
        {countdown.productTitle}
      </Text>,
      <Text variant="bodySm" tone="subdued" as="span">
        {countdown.sku}
      </Text>,
      <Text variant="bodyMd" as="span">
        {countdown.availableStock} units
      </Text>,
      <Text variant="bodyMd" as="span">
        {countdown.adjustedBurnRate.toFixed(1)}/hr
      </Text>,
      <Text variant="bodyMd" fontWeight="bold" as="span">
        {countdownDisplay}
      </Text>,
      statusBadge,
      <Text variant="bodySm" tone="subdued" as="span">
        {countdown.confidence}% confidence
      </Text>,
    ];
  });

  return (
    <DataTable
      columnContentTypes={["text", "text", "numeric", "numeric", "text", "text", "text"]}
      headings={["Product", "SKU", "Stock", "Burn Rate", "Time Left", "Status", "Confidence"]}
      rows={rows}
      truncate
    />
  );
}

/**
 * Forecast Scenario Table Component
 */
function ForecastScenarioTable({
  predictions,
  horizon,
}: {
  predictions: any[];
  horizon: "4h" | "24h" | "72h";
}) {
  const rows = predictions.slice(0, 10).map((prediction: any) => {
    const forecast = prediction.predictions[horizon];
    if (!forecast) return [];

    const riskBadge = (
      <Badge tone={getRiskBadgeTone(forecast.scenarios.likely.stockoutRisk)}>
        {forecast.scenarios.likely.stockoutRisk}% risk
      </Badge>
    );

    return [
      <Text variant="bodyMd" fontWeight="semibold" as="span">
        {prediction.productTitle}
      </Text>,
      <Text variant="bodySm" tone="subdued" as="span">
        {prediction.sku}
      </Text>,
      <BlockStack gap="100">
        <Text variant="bodySm" tone="subdued" as="span">
          Best: {forecast.scenarios.best.expectedDemand}
        </Text>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          Likely: {forecast.scenarios.likely.expectedDemand}
        </Text>
        <Text variant="bodySm" tone="subdued" as="span">
          Worst: {forecast.scenarios.worst.expectedDemand}
        </Text>
      </BlockStack>,
      <BlockStack gap="100">
        <Text variant="bodySm" tone="subdued" as="span">
          ${forecast.scenarios.best.expectedRevenue.toFixed(0)}
        </Text>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          ${forecast.scenarios.likely.expectedRevenue.toFixed(0)}
        </Text>
        <Text variant="bodySm" tone="subdued" as="span">
          ${forecast.scenarios.worst.expectedRevenue.toFixed(0)}
        </Text>
      </BlockStack>,
      riskBadge,
      <Text variant="bodySm" as="span">
        {forecast.scenarios.likely.recommendedAction}
      </Text>,
    ];
  });

  return (
    <DataTable
      columnContentTypes={["text", "text", "text", "text", "text", "text"]}
      headings={[
        "Product",
        "SKU",
        `Demand (${horizon})`,
        `Revenue (${horizon})`,
        "Stockout Risk",
        "Recommendation",
      ]}
      rows={rows}
      truncate
    />
  );
}

/**
 * Category Forecast Table Component
 */
function CategoryForecastTable({ categories }: { categories: any[] }) {
  const rows = categories.map((category: any) => {
    const trendIcon =
      category.trend === "accelerating" ? (
        <Icon source={ArrowUpIcon} tone="success" />
      ) : category.trend === "declining" ? (
        <Icon source={ArrowDownIcon} tone="critical" />
      ) : null;

    const trendBadge = (
      <InlineStack gap="100" blockAlign="center">
        {trendIcon}
        <Badge
          tone={
            category.trend === "accelerating"
              ? "success"
              : category.trend === "declining"
                ? "critical"
                : "info"
          }
        >
          {category.trend}
        </Badge>
      </InlineStack>
    );

    return [
      <Text variant="bodyMd" fontWeight="semibold" as="span">
        {category.category}
      </Text>,
      <Text variant="bodyMd" as="span">
        {category.currentVelocity.toFixed(1)}/hr
      </Text>,
      <Text variant="bodyMd" as="span">
        {category.predicted24h.toFixed(0)} units
      </Text>,
      <Text variant="bodyMd" as="span">
        {category.predicted72h.toFixed(0)} units
      </Text>,
      trendBadge,
      <Text variant="bodySm" tone="subdued" as="span">
        {category.confidence}%
      </Text>,
    ];
  });

  return (
    <DataTable
      columnContentTypes={["text", "numeric", "numeric", "numeric", "text", "text"]}
      headings={[
        "Category",
        "Current Velocity",
        "24h Forecast",
        "72h Forecast",
        "Trend",
        "Confidence",
      ]}
      rows={rows}
      truncate
    />
  );
}

/**
 * Helper: Get badge tone for countdown status
 */
function getCountdownBadgeTone(
  status: string
): "critical" | "warning" | "attention" | "info" | "success" {
  switch (status) {
    case "STOCKED_OUT":
    case "CRITICAL":
      return "critical";
    case "URGENT":
      return "warning";
    case "WARNING":
      return "attention";
    case "WATCH":
      return "info";
    case "HEALTHY":
      return "success";
    default:
      return "info";
  }
}

/**
 * Helper: Get badge tone for stockout risk
 */
function getRiskBadgeTone(
  risk: number
): "critical" | "warning" | "attention" | "info" | "success" {
  if (risk >= 80) return "critical";
  if (risk >= 60) return "warning";
  if (risk >= 40) return "attention";
  if (risk >= 20) return "info";
  return "success";
}

/**
 * Helper: Format countdown time
 */
function formatCountdownTime(countdown: any): string {
  if (countdown.status === "STOCKED_OUT") {
    return "STOCKED OUT";
  }

  if (countdown.hoursUntilStockout >= 72) {
    const days = Math.floor(countdown.hoursUntilStockout / 24);
    return `${days}d+`;
  }

  if (countdown.hoursUntilStockout >= 24) {
    const hours = Math.floor(countdown.hoursUntilStockout);
    return `${hours}h`;
  }

  if (countdown.hoursUntilStockout >= 1) {
    const hours = Math.floor(countdown.hoursUntilStockout);
    const minutes = Math.floor((countdown.hoursUntilStockout - hours) * 60);
    return `${hours}h ${minutes}m`;
  }

  return `${countdown.minutesUntilStockout}m`;
}
