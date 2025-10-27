import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Badge,
  Icon,
  InlineStack,
  Banner,
  Button,
  ProgressBar,
} from "@shopify/polaris";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import cache, { getCacheKey } from "../services/cache.server";
import {
  calculateDEFCON,
  getLatestDEFCON,
  type DEFCONStatus,
} from "../services/defcon-calculator.server";
import {
  getRevenueRiskSummary,
  getTopAtRiskProducts,
} from "../services/revenue-risk.server";
import { getVelocitySummary } from "../services/velocity-detector.server";
import { getPredictionSummary } from "../services/prediction-engine.server";
import { getCountdownSummary } from "../services/stockout-countdown.server";
import {
  calculatePerformanceMetrics,
  getPerformanceTrends,
} from "../services/performance-tracker.server";
import { getCompetitiveIntelligence } from "../services/competitive-intel.server";
import MetricsDashboard from "../components/MetricsDashboard";
import PredictionPanel from "../components/PredictionPanel";
import { Scoreboard } from "../components/Scoreboard";

interface LoaderData {
  shop: string;
  defcon: DEFCONStatus | null;
  revenueRisk: any;
  topAtRiskProducts: any[];
  velocitySummary: any;
  predictions: any;
  countdowns: any;
  performanceMetrics: any;
  performanceTrends: any[];
  competitiveMetrics: any;
  lastUpdated: string;
  cacheHit: boolean;
}

/**
 * LOADER - Fetch War Room data with Redis caching
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const startTime = Date.now();
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Try Redis cache first (5-minute TTL)
  const cacheKey = getCacheKey("war-room", "defcon", shop);
  const cached = await cache.get<LoaderData>(cacheKey);

  if (cached) {
    const loadTime = Date.now() - startTime;
    console.log(`⚡ War Room loaded from cache in ${loadTime}ms`);
    return json(
      { ...cached, cacheHit: true },
      {
        headers: {
          "X-Cache": "HIT",
          "X-Load-Time": `${loadTime}ms`,
        },
      }
    );
  }

  // Cache miss - calculate DEFCON status
  console.log(`📭 Cache miss for War Room, calculating metrics...`);

  // Try to get latest cached DEFCON from database
  let defcon = await getLatestDEFCON(shop);

  // If no recent data (older than 5 minutes), recalculate
  if (!defcon) {
    console.log("🔄 No recent DEFCON data, calculating...");
    defcon = await calculateDEFCON(shop);
  }

  // Calculate revenue risk and velocity anomalies
  const revenueRisk = await getRevenueRiskSummary(shop);
  const topAtRiskProducts = await getTopAtRiskProducts(shop, 10);
  const velocitySummary = await getVelocitySummary(shop);

  // Calculate predictions and countdowns (Session 3)
  const predictions = await getPredictionSummary(shop);
  const countdowns = await getCountdownSummary(shop);

  // Calculate performance metrics and competitive intelligence (Session 6)
  const performanceMetrics = await calculatePerformanceMetrics(shop, 24);
  const performanceTrends = await getPerformanceTrends(shop);
  const competitiveMetrics = await getCompetitiveIntelligence(shop);

  const data: LoaderData = {
    shop,
    defcon,
    revenueRisk,
    topAtRiskProducts,
    velocitySummary,
    predictions,
    countdowns,
    performanceMetrics,
    performanceTrends,
    competitiveMetrics,
    lastUpdated: new Date().toISOString(),
    cacheHit: false,
  };

  // Store in Redis cache (5-minute TTL for main dashboard, 15-min for predictions)
  cache.set(cacheKey, data, 300).catch((err) => {
    console.error("⚠️ Failed to cache War Room data:", err);
  });

  // Also cache predictions separately with longer TTL (15 minutes)
  const predictionsCacheKey = getCacheKey("war-room", "predictions", shop);
  cache.set(predictionsCacheKey, { predictions, countdowns }, 900).catch((err) => {
    console.error("⚠️ Failed to cache predictions:", err);
  });

  const loadTime = Date.now() - startTime;
  console.log(`🎯 War Room loaded from database in ${loadTime}ms`);

  return json(data, {
    headers: {
      "X-Cache": "MISS",
      "X-Load-Time": `${loadTime}ms`,
    },
  });
}

/**
 * ACTION - Handle manual refresh
 */
export async function action({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Force recalculation
  console.log("🔄 Manual refresh triggered, recalculating DEFCON...");
  await calculateDEFCON(shop);

  // Invalidate cache
  const cacheKey = getCacheKey("war-room", "defcon", shop);
  await cache.delete(cacheKey);

  return json({ success: true });
}

/**
 * DEFCON Status Card Component
 */
function DEFCONCard({ defcon }: { defcon: DEFCONStatus }) {
  // Map DEFCON level to color
  const getColor = (): "critical" | "warning" | "info" | "success" => {
    switch (defcon.color) {
      case "critical":
        return "critical";
      case "warning":
        return "warning";
      case "caution":
        return "info";
      case "success":
        return "success";
      default:
        return "info";
    }
  };

  const getBadgeTone = ():
    | "critical"
    | "warning"
    | "info"
    | "success"
    | "attention" => {
    switch (defcon.color) {
      case "critical":
        return "critical";
      case "warning":
        return "warning";
      case "caution":
        return "attention";
      case "success":
        return "success";
      default:
        return "info";
    }
  };

  const getBackgroundColor = () => {
    switch (defcon.level) {
      case 1:
        return "rgba(224, 45, 45, 0.1)"; // Red
      case 2:
        return "rgba(255, 138, 0, 0.1)"; // Orange
      case 3:
        return "rgba(255, 196, 0, 0.1)"; // Yellow
      case 4:
        return "rgba(0, 148, 213, 0.1)"; // Blue
      case 5:
        return "rgba(80, 184, 60, 0.1)"; // Green
      default:
        return "rgba(0, 0, 0, 0.05)";
    }
  };

  return (
    <Card>
      <Box
        padding="600"
        background={getBackgroundColor() as any}
        borderRadius="200"
      >
        <BlockStack gap="500">
          {/* DEFCON Level Header */}
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="200">
              <Text variant="headingXl" as="h1">
                DEFCON {defcon.level}
              </Text>
              <Badge tone={getBadgeTone()} size="large">
                {defcon.label}
              </Badge>
            </BlockStack>
            <Icon
              source={
                defcon.level <= 2 ? AlertCircleIcon : CheckCircleIcon
              }
              tone={getColor()}
            />
          </InlineStack>

          {/* Risk Score Progress Bar */}
          <BlockStack gap="200">
            <InlineStack align="space-between">
              <Text variant="bodyMd" as="span">
                Risk Score
              </Text>
              <Text variant="bodyMd" as="span" fontWeight="bold">
                {defcon.riskScore}/100
              </Text>
            </InlineStack>
            <ProgressBar
              progress={defcon.riskScore}
              size="small"
              tone={getColor()}
            />
          </BlockStack>

          {/* Key Metrics */}
          <InlineGrid columns={3} gap="400">
            <BlockStack gap="100">
              <Text variant="bodySm" tone="subdued" as="span">
                Avg Coverage
              </Text>
              <Text variant="headingMd" as="p">
                {defcon.inventoryCoverageHours.toFixed(1)}h
              </Text>
            </BlockStack>
            <BlockStack gap="100">
              <Text variant="bodySm" tone="subdued" as="span">
                Critical SKUs
              </Text>
              <Text variant="headingMd" as="p" tone={defcon.criticalSKUs > 0 ? "critical" : undefined}>
                {defcon.criticalSKUs}
              </Text>
            </BlockStack>
            <BlockStack gap="100">
              <Text variant="bodySm" tone="subdued" as="span">
                Velocity Anomalies
              </Text>
              <Text variant="headingMd" as="p">
                {defcon.velocityAnomaly.toFixed(0)}%
              </Text>
            </BlockStack>
          </InlineGrid>

          {/* Escalation Triggers */}
          <BlockStack gap="200">
            <Text variant="bodyMd" fontWeight="semibold" as="span">
              Status Triggers:
            </Text>
            {defcon.escalationTriggers.map((trigger, index) => (
              <InlineStack key={index} gap="200" blockAlign="center">
                <Box
                  background={
                    defcon.level <= 2 ? "bg-fill-critical" : "bg-fill-info"
                  }
                  borderRadius="100"
                  padding="050"
                >
                  <div style={{ width: 8, height: 8 }} />
                </Box>
                <Text variant="bodySm" as="span">
                  {trigger}
                </Text>
              </InlineStack>
            ))}
          </BlockStack>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * SKU Health Breakdown Component
 */
function SKUHealthCard({ defcon }: { defcon: DEFCONStatus }) {
  const total = defcon.totalSKUs;
  const criticalPercent = total > 0 ? (defcon.criticalSKUs / total) * 100 : 0;
  const warningPercent = total > 0 ? (defcon.warningSKUs / total) * 100 : 0;
  const healthyPercent = total > 0 ? (defcon.healthySKUs / total) * 100 : 0;

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="400">
          <Text variant="headingMd" as="h2">
            SKU Health Breakdown
          </Text>

          <InlineGrid columns={3} gap="400">
            {/* Critical */}
            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Critical
                    </Text>
                    <Badge tone="critical">{criticalPercent.toFixed(0)}%</Badge>
                  </InlineStack>
                  <Text variant="headingLg" as="h3" tone="critical">
                    {defcon.criticalSKUs}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    &lt;4 hours coverage
                  </Text>
                </BlockStack>
              </Box>
            </Card>

            {/* Warning */}
            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Warning
                    </Text>
                    <Badge tone="warning">{warningPercent.toFixed(0)}%</Badge>
                  </InlineStack>
                  <Text variant="headingLg" as="h3">
                    {defcon.warningSKUs}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    4-24 hours coverage
                  </Text>
                </BlockStack>
              </Box>
            </Card>

            {/* Healthy */}
            <Card>
              <Box padding="300">
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text variant="bodyMd" tone="subdued" as="span">
                      Healthy
                    </Text>
                    <Badge tone="success">{healthyPercent.toFixed(0)}%</Badge>
                  </InlineStack>
                  <Text variant="headingLg" as="h3" tone="success">
                    {defcon.healthySKUs}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    &gt;24 hours coverage
                  </Text>
                </BlockStack>
              </Box>
            </Card>
          </InlineGrid>

          <Text variant="bodySm" tone="subdued" as="p">
            Total: {total} SKUs monitored
          </Text>
        </BlockStack>
      </Box>
    </Card>
  );
}

/**
 * Main War Room Dashboard
 */
export default function WarRoomDashboard() {
  const {
    shop,
    defcon,
    revenueRisk,
    topAtRiskProducts,
    velocitySummary,
    predictions,
    countdowns,
    performanceMetrics,
    performanceTrends,
    competitiveMetrics,
    lastUpdated,
    cacheHit,
  } = useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("🔄 Auto-refreshing War Room...");
      revalidator.revalidate();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [revalidator]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch("/app/war-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      revalidator.revalidate();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString();
  };

  // Empty state if no DEFCON data
  if (!defcon) {
    return (
      <Page
        title="BFCM War Room"
        subtitle={`Mission control for ${shop}`}
        primaryAction={{
          content: "Calculate Status",
          onAction: handleRefresh,
          loading: isRefreshing,
        }}
      >
        <Layout>
          <Layout.Section>
            <Banner
              title="No War Room data available"
              tone="info"
              action={{
                content: "Initialize War Room",
                onAction: handleRefresh,
              }}
            >
              <p>
                Click the button above to calculate your first DEFCON status.
                This will analyze your inventory and order history to determine
                system health.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="BFCM War Room"
      subtitle={`Mission control for ${shop}`}
      primaryAction={{
        content: "Refresh Status",
        onAction: handleRefresh,
        loading: isRefreshing || revalidator.state === "loading",
        icon: RefreshIcon,
      }}
      secondaryActions={[
        {
          content: "Alerts",
          onAction: () => navigate("/app/war-room/alerts"),
        },
        {
          content: "Actions",
          onAction: () => navigate("/app/war-room/actions"),
        },
        {
          content: "Simulation Lab",
          onAction: () => navigate("/app/war-room/simulate"),
        },
        {
          content: "ROI & Attribution",
          onAction: () => navigate("/app/war-room/roi"),
        },
        {
          content: "View Analytics",
          onAction: () => navigate("/app/analytics"),
        },
      ]}
    >
      <Layout>
        {/* Last Updated Indicator */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={ClockIcon} tone="subdued" />
                  <Text variant="bodyMd" as="span">
                    Last updated: {formatTimestamp(lastUpdated)}
                  </Text>
                  {cacheHit && <Badge tone="success">⚡ Cached</Badge>}
                  {revalidator.state === "loading" && (
                    <Badge tone="info">Updating...</Badge>
                  )}
                </InlineStack>
                <Text variant="bodySm" tone="subdued" as="span">
                  Auto-refresh: 5 minutes
                </Text>
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* DEFCON Status Board */}
        <Layout.Section>
          <DEFCONCard defcon={defcon} />
        </Layout.Section>

        {/* Quick Actions - Streamlined without descriptions */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, sm: 2, md: 2 }} gap="400">
            {/* Alerts Quick Access */}
            <Card>
              <Box padding="400">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <Icon source={AlertCircleIcon} tone="warning" />
                      <Text variant="headingMd" as="h3">
                        Alert Center
                      </Text>
                    </InlineStack>
                    <Badge tone="attention" size="large">View →</Badge>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Manage notifications and alert rules
                  </Text>
                  <Button onClick={() => navigate("/app/war-room/alerts")} fullWidth>
                    Go to Alerts
                  </Button>
                </BlockStack>
              </Box>
            </Card>

            {/* Actions Quick Access */}
            <Card>
              <Box padding="400">
                <BlockStack gap="200">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <Icon source={CheckCircleIcon} tone="success" />
                      <Text variant="headingMd" as="h3">
                        Action Center
                      </Text>
                    </InlineStack>
                    <Badge tone="info" size="large">View →</Badge>
                  </InlineStack>
                  <Text variant="bodySm" tone="subdued" as="p">
                    Execute AI-powered recommendations
                  </Text>
                  <Button onClick={() => navigate("/app/war-room/actions")} fullWidth>
                    Go to Actions
                  </Button>
                </BlockStack>
              </Box>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* SKU Health Breakdown */}
        <Layout.Section>
          <SKUHealthCard defcon={defcon} />
        </Layout.Section>

        {/* Mission Critical Metrics Dashboard - Session 2 */}
        <Layout.Section>
          <MetricsDashboard
            revenueRisk={revenueRisk}
            topAtRiskProducts={topAtRiskProducts}
            velocitySummary={velocitySummary}
          />
        </Layout.Section>

        {/* Predictive Intelligence - Session 3 */}
        <Layout.Section>
          <PredictionPanel predictions={predictions} countdowns={countdowns} />
        </Layout.Section>

        {/* Performance Scoreboard & Competitive Intelligence - Session 6 */}
        <Layout.Section>
          <Scoreboard
            performanceMetrics={performanceMetrics}
            trends={performanceTrends}
            competitiveMetrics={competitiveMetrics}
          />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
