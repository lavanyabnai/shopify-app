/**
 * ROI Dashboard Component
 *
 * Displays financial impact metrics:
 * - Revenue saved counter
 * - Margin protected display
 * - Opportunity captured metrics
 * - Attribution breakdown
 * - Hourly tracking chart
 *
 * Session 8 - BFCM War Room
 */

import {
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Badge,
  DataTable,
  ProgressBar,
  InlineStack,
  Box,
  Divider,
} from "@shopify/polaris";
import type {
  ROIMetrics,
  ActionImpact,
  TimeSeriesROI,
  CategoryBreakdown,
} from "../services/roi-tracker.server";

interface ROIDashboardProps {
  summary: ROIMetrics;
  hourly: ROIMetrics;
  daily: ROIMetrics;
  weekly: ROIMetrics;
  categoryBreakdown: CategoryBreakdown[];
  topActions: ActionImpact[];
  timeSeries: TimeSeriesROI[];
  comparison?: {
    withWarRoom: number;
    withoutWarRoom: number;
    improvement: number;
    improvementPercentage: number;
  };
}

export function ROIDashboard({
  summary,
  hourly,
  daily,
  weekly,
  categoryBreakdown,
  topActions,
  timeSeries,
  comparison,
}: ROIDashboardProps) {
  return (
    <BlockStack gap="400">
      {/* Summary Cards */}
      <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Total Value Created
            </Text>
            <Text as="p" variant="heading2xl">
              ${formatCurrency(summary.totalValue)}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {summary.actionCount} actions executed
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Revenue Saved
            </Text>
            <Text as="p" variant="heading2xl" tone="success">
              ${formatCurrency(summary.revenueSaved)}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              From prevented stockouts
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Margin Protected
            </Text>
            <Text as="p" variant="heading2xl">
              ${formatCurrency(summary.marginProtected)}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Avoided expedited costs
            </Text>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="200">
            <Text as="h3" variant="headingMd">
              Opportunity Captured
            </Text>
            <Text as="p" variant="heading2xl">
              ${formatCurrency(summary.opportunityCaptured)}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Competitor overflow
            </Text>
          </BlockStack>
        </Card>
      </InlineGrid>

      {/* Comparison Card (if available) */}
      {comparison && (
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingLg">
              ROI Comparison
            </Text>
            <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
              <Box>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    With War Room
                  </Text>
                  <Text as="p" variant="headingXl" tone="success">
                    ${formatCurrency(comparison.withWarRoom)}
                  </Text>
                </BlockStack>
              </Box>

              <Box>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Without War Room (Est.)
                  </Text>
                  <Text as="p" variant="headingXl">
                    ${formatCurrency(comparison.withoutWarRoom)}
                  </Text>
                </BlockStack>
              </Box>

              <Box>
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Improvement
                  </Text>
                  <Text as="p" variant="headingXl" tone="success">
                    +${formatCurrency(comparison.improvement || 0)}
                  </Text>
                  <Badge tone="success">
                    {`+${(comparison.improvementPercentage || 0).toFixed(1)}%`}
                  </Badge>
                </BlockStack>
              </Box>
            </InlineGrid>
          </BlockStack>
        </Card>
      )}

      {/* Period Breakdown */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            Value by Time Period
            </Text>
          <InlineGrid columns={{ xs: 1, md: 3 }} gap="400">
            <Box>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Last Hour
                  </Text>
                  <Text as="p" variant="headingMd">
                    ${formatCurrency(hourly.totalValue)}
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={Math.min(100, summary.totalValue > 0 ? (hourly.totalValue / summary.totalValue) * 100 : 0)}
                  size="small"
                />
                <Text as="p" variant="bodySm" tone="subdued">
                  {hourly.actionCount} actions
                </Text>
              </BlockStack>
            </Box>

            <Box>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Last 24 Hours
                  </Text>
                  <Text as="p" variant="headingMd">
                    ${formatCurrency(daily.totalValue)}
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={Math.min(100, summary.totalValue > 0 ? (daily.totalValue / summary.totalValue) * 100 : 0)}
                  size="small"
                  tone="primary"
                />
                <Text as="p" variant="bodySm" tone="subdued">
                  {daily.actionCount} actions
                </Text>
              </BlockStack>
            </Box>

            <Box>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodyMd">
                    Last 7 Days
                  </Text>
                  <Text as="p" variant="headingMd">
                    ${formatCurrency(weekly.totalValue)}
                  </Text>
                </InlineStack>
                <ProgressBar
                  progress={Math.min(100, summary.totalValue > 0 ? (weekly.totalValue / summary.totalValue) * 100 : 0)}
                  size="small"
                  tone="success"
                />
                <Text as="p" variant="bodySm" tone="subdued">
                  {weekly.actionCount} actions
                </Text>
              </BlockStack>
            </Box>
          </InlineGrid>
        </BlockStack>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            Impact by Category
          </Text>
          <BlockStack gap="300">
            {categoryBreakdown.map((category) => (
              <Box key={category.category}>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodyMd">
                      {category.category}
                    </Text>
                    <Text as="p" variant="headingMd">
                      ${formatCurrency(category.value)}
                    </Text>
                  </InlineStack>
                  <ProgressBar progress={(category.percentage == null || isNaN(category.percentage)) ? 0 : Math.min(100, category.percentage)} size="small" />
                  <InlineStack gap="200">
                    <Badge tone="info">{(category.percentage == null || isNaN(category.percentage)) ? '0%' : `${category.percentage.toFixed(1)}%`}</Badge>
                    <Text as="p" variant="bodySm" tone="subdued">
                      {category.actionCount} actions
                    </Text>
                  </InlineStack>
                </BlockStack>
                <Box paddingBlockStart="300">
                  <Divider />
                </Box>
              </Box>
            ))}
          </BlockStack>
        </BlockStack>
      </Card>

      {/* Top Actions */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            Top 10 Impactful Actions
          </Text>
          <DataTable
            columnContentTypes={["text", "text", "numeric", "numeric", "numeric"]}
            headings={["Action Type", "Category", "Estimated Impact", "Actual Impact", "Net ROI"]}
            rows={topActions.map((action) => [
              <Badge key="type" tone="info">
                {formatActionType(action.actionType)}
              </Badge>,
              <Badge key="category" tone={getCategoryTone(action.category)}>
                {formatCategory(action.category)}
              </Badge>,
              `$${formatCurrency(action.estimatedImpact)}`,
              `$${formatCurrency(action.actualImpact)}`,
              <Text
                key="roi"
                as="span"
                fontWeight="semibold"
                tone={action.netROI > 0 ? "success" : "critical"}
              >
                ${formatCurrency(action.netROI)}
              </Text>,
            ])}
          />
        </BlockStack>
      </Card>

      {/* Time Series Chart (Simple visualization) */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingLg">
            Cumulative Value Over Time (Last 24 Hours)
          </Text>
          {timeSeries.length > 0 ? (
            <Box>
              <BlockStack gap="200">
                {timeSeries.slice(-12).map((dataPoint, index) => (
                  <Box key={index}>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="p" variant="bodySm" tone="subdued">
                        {formatTimestamp(dataPoint.timestamp)}
                      </Text>
                      <InlineStack gap="400">
                        <Text as="p" variant="bodySm">
                          Revenue: ${formatCurrency(dataPoint.revenueSaved)}
                        </Text>
                        <Text as="p" variant="bodySm">
                          Margin: ${formatCurrency(dataPoint.marginProtected)}
                        </Text>
                        <Text as="p" variant="bodySm">
                          Opportunity: ${formatCurrency(dataPoint.opportunityCaptured)}
                        </Text>
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          Total: ${formatCurrency(dataPoint.cumulativeValue)}
                        </Text>
                      </InlineStack>
                    </InlineStack>
                    <Box paddingBlockStart="200">
                      <ProgressBar
                        progress={Math.min(
                          100,
                          summary.totalValue > 0
                            ? (dataPoint.cumulativeValue / summary.totalValue) * 100
                            : 0
                        )}
                        size="small"
                        tone="success"
                      />
                    </Box>
                  </Box>
                ))}
              </BlockStack>
            </Box>
          ) : (
            <Text as="p" tone="subdued">
              No time series data available yet.
            </Text>
          )}
        </BlockStack>
      </Card>

      {/* Average ROI per Action */}
      <Card>
        <BlockStack gap="200">
          <Text as="h3" variant="headingMd">
            Average ROI per Action
          </Text>
          <Text as="p" variant="heading2xl" tone="success">
            ${formatCurrency(summary.avgROIPerAction)}
          </Text>
          <Text as="p" variant="bodySm" tone="subdued">
            Based on {summary.actionCount} executed actions
          </Text>
        </BlockStack>
      </Card>
    </BlockStack>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number | null | undefined): string {
  // Handle null, undefined, or NaN values
  if (value == null || isNaN(value)) {
    return "0.00";
  }

  if (value >= 1000000) {
    return (value / 1000000).toFixed(2) + "M";
  } else if (value >= 1000) {
    return (value / 1000).toFixed(2) + "K";
  }
  return value.toFixed(2);
}

function formatActionType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCategory(category: string): string {
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCategoryTone(
  category: string
): "success" | "warning" | "info" | "critical" | "attention" | "new" | undefined {
  switch (category) {
    case "revenue_saved":
      return "success";
    case "margin_protected":
      return "warning";
    case "opportunity_captured":
      return "info";
    default:
      return undefined;
  }
}

function formatTimestamp(timestamp: Date): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
