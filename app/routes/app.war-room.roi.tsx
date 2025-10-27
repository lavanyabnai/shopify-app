/**
 * ROI & Attribution Dashboard Route
 *
 * Displays comprehensive financial impact and attribution analysis:
 * - ROI metrics and breakdown
 * - Attribution reports
 * - Decision audit trail
 * - Success patterns
 * - Model accuracy tracking
 *
 * Session 8 - BFCM War Room
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  InlineGrid,
  Badge,
  DataTable,
  Button,
  InlineStack,
  Box,
} from "@shopify/polaris";
import { RefreshIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { ROIDashboard } from "../components/ROIDashboard";
import {
  generateROIReport,
  getROIComparison,
} from "../services/roi-tracker.server";
import {
  generateAttributionReport,
} from "../services/attribution-engine.server";
import { useEffect } from "react";

// ============================================================================
// Loader
// ============================================================================

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const startTime = Date.now();

  try {
    // Fetch all data in parallel
    const [roiReport, roiComparison, attributionReport] = await Promise.all([
      generateROIReport(shop),
      getROIComparison(shop),
      generateAttributionReport(shop),
    ]);

    const loadTime = Date.now() - startTime;
    console.log(`✅ ROI dashboard loaded in ${loadTime}ms`);

    return json({
      roiReport,
      roiComparison,
      attributionReport,
      loadTime,
    });
  } catch (error) {
    console.error("❌ Error loading ROI dashboard:", error);
    throw error;
  }
}

// ============================================================================
// Component
// ============================================================================

export default function WarRoomROI() {
  const { roiReport, roiComparison, attributionReport, loadTime } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      revalidator.revalidate();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [revalidator]);

  return (
    <Page
      title="ROI & Attribution Dashboard"
      subtitle="Financial impact analysis and decision attribution"
      backAction={{ url: "/app/war-room" }}
      secondaryActions={[
        {
          content: "Refresh",
          icon: RefreshIcon,
          onAction: () => revalidator.revalidate(),
          loading: revalidator.state === "loading",
        },
      ]}
    >
      <Layout>
        {/* Load Time Badge */}
        <Layout.Section>
          <InlineStack align="end">
            <Badge tone={loadTime < 100 ? "success" : loadTime < 2000 ? "info" : "warning"}>
              {`Loaded in ${loadTime}ms`}
            </Badge>
          </InlineStack>
        </Layout.Section>

        {/* ROI Dashboard */}
        <Layout.Section>
          <ROIDashboard
            summary={roiReport.summary}
            hourly={roiReport.hourly}
            daily={roiReport.daily}
            weekly={roiReport.weekly}
            categoryBreakdown={roiReport.categoryBreakdown}
            topActions={roiReport.topActions.map((a) => ({
              ...a,
              executedAt: new Date(a.executedAt),
            }))}
            timeSeries={roiReport.timeSeries.map((row) => ({
              ...row,
              timestamp: new Date(row.timestamp),
            }))}
            comparison={roiComparison}
          />
        </Layout.Section>

        {/* Attribution Section */}
        <Layout.Section>
          <BlockStack gap="400">
            {/* Success Patterns */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Success Patterns
                </Text>
                {attributionReport.successPatterns.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                    headings={[
                      "Pattern",
                      "Occurrences",
                      "Avg Impact",
                      "Success Rate",
                    ]}
                    rows={attributionReport.successPatterns.slice(0, 10).map((pattern) => {
                      const successRate = pattern.successRate ?? 0;
                      return [
                        pattern.description,
                        pattern.occurrences.toString(),
                        `$${(pattern.avgImpact ?? 0).toFixed(2)}`,
                        <Badge
                          key="success"
                          tone={successRate >= 80 ? "success" : successRate >= 60 ? "info" : "warning"}
                        >
                          {`${successRate.toFixed(1)}%`}
                        </Badge>,
                      ];
                    })}
                  />
                ) : (
                  <Text as="p" tone="subdued">
                    Not enough data yet to identify patterns.
                  </Text>
                )}
              </BlockStack>
            </Card>

            {/* Model Accuracy */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Model Accuracy
                </Text>
                <InlineGrid columns={{ xs: 1, md: 2, lg: 4 }} gap="400">
                  {Object.entries(attributionReport.modelAccuracy).map(([model, accuracy]) => {
                    const accuracyValue = accuracy.accuracy ?? 0;
                    const maeValue = accuracy.mae ?? 0;
                    return (
                      <Box key={model}>
                        <BlockStack gap="200">
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {formatModelName(model)}
                          </Text>
                          <Text as="p" variant="headingXl">
                            {accuracyValue.toFixed(1)}%
                          </Text>
                          <Badge
                            tone={
                              accuracyValue >= 80
                                ? "success"
                                : accuracyValue >= 60
                                ? "info"
                                : "warning"
                            }
                          >
                            {`${accuracy.predictions} predictions`}
                          </Badge>
                          <Text as="p" variant="bodySm" tone="subdued">
                            MAE: {maeValue.toFixed(2)}
                          </Text>
                        </BlockStack>
                      </Box>
                    );
                  })}
                </InlineGrid>
              </BlockStack>
            </Card>

            {/* Continuous Improvement */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Continuous Improvement Metrics
                </Text>
                <BlockStack gap="300">
                  {attributionReport.continuousImprovement.map((metric) => {
                    const baseline = metric.baseline ?? 0;
                    const current = metric.current ?? 0;
                    const improvement = metric.improvement ?? 0;
                    return (
                      <Box key={metric.metric}>
                        <InlineStack align="space-between" blockAlign="center">
                          <Box>
                            <Text as="p" variant="bodyMd">
                              {formatMetricName(metric.metric)}
                            </Text>
                          </Box>
                          <InlineStack gap="400" blockAlign="center">
                            <Text as="p" variant="bodySm" tone="subdued">
                              Baseline: {baseline.toFixed(2)}
                            </Text>
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              Current: {current.toFixed(2)}
                            </Text>
                            <Badge tone={getTrendTone(metric.trend)}>
                              {`${metric.trend === "improving" ? "↑" : metric.trend === "declining" ? "↓" : "→"} ${improvement >= 0 ? "+" : ""}${improvement.toFixed(2)}`}
                            </Badge>
                          </InlineStack>
                        </InlineStack>
                      </Box>
                    );
                  })}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Counterfactual Analysis */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Counterfactual Analysis
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Comparison of actual outcomes vs. estimated outcomes without War Room actions
                </Text>
                {attributionReport.counterfactualAnalyses.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                    headings={[
                      "Action ID",
                      "Actual ROI",
                      "Counterfactual ROI",
                      "Value Created",
                    ]}
                    rows={attributionReport.counterfactualAnalyses.slice(0, 10).map((analysis) => {
                      const actualROI = analysis.actualOutcome.netROI ?? 0;
                      const estimatedROI = analysis.counterfactual.estimatedNetROI ?? 0;
                      const differenceROI = analysis.difference.netROI ?? 0;
                      return [
                        analysis.actionId.slice(0, 12) + "...",
                        `$${actualROI.toFixed(2)}`,
                        `$${estimatedROI.toFixed(2)}`,
                        <Text
                          key="value"
                          as="span"
                          fontWeight="semibold"
                          tone={differenceROI > 0 ? "success" : "critical"}
                        >
                          ${differenceROI.toFixed(2)}
                        </Text>,
                      ];
                    })}
                  />
                ) : (
                  <Text as="p" tone="subdued">
                    No counterfactual analysis available yet.
                  </Text>
                )}
              </BlockStack>
            </Card>

            {/* Decision Audit Trail */}
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Decision Audit Trail (Recent 20)
                </Text>
                {attributionReport.decisionAuditTrail.length > 0 ? (
                  <DataTable
                    columnContentTypes={["text", "text", "text", "numeric"]}
                    headings={["Timestamp", "Decision Type", "Success", "Impact Score"]}
                    rows={attributionReport.decisionAuditTrail.slice(0, 20).map((decision) => {
                      const impactScore = decision.impactScore ?? 0;
                      return [
                        new Date(decision.timestamp).toLocaleString(),
                        <Badge key="type" tone="info">
                          {formatDecisionType(decision.decisionType)}
                        </Badge>,
                        <Badge key="success" tone={decision.success ? "success" : "critical"}>
                          {decision.success ? "✓ Success" : "✗ Failed"}
                        </Badge>,
                        impactScore.toFixed(1),
                      ];
                    })}
                  />
                ) : (
                  <Text as="p" tone="subdued">
                    No decisions logged yet.
                  </Text>
                )}
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        {/* Summary Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h3" variant="headingMd">
                About This Dashboard
              </Text>
              <Text as="p" variant="bodyMd">
                This dashboard tracks the financial impact of all War Room decisions and provides
                attribution analysis to understand what's working and what isn't.
              </Text>
              <BlockStack gap="100">
                <Text as="p" variant="bodySm">
                  • <strong>ROI Metrics:</strong> Track revenue saved, margin protected, and opportunities captured
                </Text>
                <Text as="p" variant="bodySm">
                  • <strong>Success Patterns:</strong> Identify which action types and conditions lead to best outcomes
                </Text>
                <Text as="p" variant="bodySm">
                  • <strong>Model Accuracy:</strong> Monitor prediction accuracy to improve over time
                </Text>
                <Text as="p" variant="bodySm">
                  • <strong>Counterfactual Analysis:</strong> Understand the value created by each action
                </Text>
                <Text as="p" variant="bodySm">
                  • <strong>Decision Audit:</strong> Complete history of all decisions and their outcomes
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatModelName(model: string): string {
  return model
    .split(/(?=[A-Z])/)
    .join(" ")
    .replace(/^./, (str) => str.toUpperCase());
}

function formatMetricName(metric: string): string {
  return metric
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDecisionType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getTrendTone(
  trend: string
): "success" | "warning" | "info" | "critical" | "attention" | "new" | undefined {
  switch (trend) {
    case "improving":
      return "success";
    case "declining":
      return "critical";
    case "stable":
      return "info";
    default:
      return undefined;
  }
}
