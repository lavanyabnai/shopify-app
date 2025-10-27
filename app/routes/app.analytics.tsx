import { redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import cache, { CACHE_KEYS } from "../services/cache.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Badge,
  DataTable,
  Icon,
  InlineStack,
  Banner,
  ButtonGroup,
  Button,
} from "@shopify/polaris";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PackageIcon,
  CashDollarIcon,
  RefreshIcon,
  ClockIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

// TypeScript interfaces for our data structures
interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  fulfilledOrders: number;
  paidOrders: number;
  monthlyData: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
  productData: Array<{
    name: string;
    quantity: number;
    revenue: number;
    orders: number;
  }>;
  customerSegments: {
    new: number;
    returning: number;
    vip: number;
  };
  locationData: Array<{
    location: string;
    orders: number;
    revenue: number;
  }>;
}

interface LoaderData {
  analytics: AnalyticsData;
  shop: string;
  syncStatus: {
    lastOrderSync: string | null;
    lastProductSync: string | null;
    syncInProgress: boolean;
    totalOrders: number;
    totalProducts: number;
    hasData: boolean;
  };
  dataSource: "snapshot" | "computed" | "empty" | "cache";
  cacheHit: boolean;
  timeRange: string;
}

/**
 * OPTIMIZED LOADER WITH REDIS CACHING
 * Target: <500ms on cache hit, <2s on cache miss
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const startTime = Date.now();
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  // Get time range filter from URL (default: "12months")
  const url = new URL(request.url);
  const timeRange = url.searchParams.get("range") || "12months";

  // Try to get from Redis cache first (include time range in cache key)
  const cacheKey = `${CACHE_KEYS.ANALYTICS_SNAPSHOT(shop)}:${timeRange}`;
  const cachedData = await cache.get<LoaderData>(cacheKey);

  if (cachedData) {
    const loadTime = Date.now() - startTime;
    console.log(`🚀 Analytics dashboard loaded from cache in ${loadTime}ms`);
    return Response.json(
      { ...cachedData, cacheHit: true },
      {
        headers: {
          "X-Cache": "HIT",
          "X-Load-Time": `${loadTime}ms`,
        },
      }
    );
  }

  // Cache miss - fetch from database
  console.log(`📭 Cache miss for ${shop}, querying database...`);

  // Fetch sync status to show data freshness
  let syncStatus = await db.syncStatus.findUnique({
    where: { shop },
  });

  // Get daily snapshots based on time range filter
  const whereClause: any = {
    shop,
    period: "daily",
  };

  // Apply date filter based on time range
  const now = new Date();
  switch (timeRange) {
    case "1month":
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      whereClause.date = { gte: oneMonthAgo };
      break;
    case "3months":
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      whereClause.date = { gte: threeMonthsAgo };
      break;
    case "6months":
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      whereClause.date = { gte: sixMonthsAgo };
      break;
    case "12months":
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      whereClause.date = { gte: twelveMonthsAgo };
      break;
    case "year":
      const yearStart = new Date(now.getFullYear(), 0, 1);
      whereClause.date = { gte: yearStart };
      break;
    case "alltime":
      // No date filter for all-time
      break;
  }

  const monthlySnapshots = await db.analyticsSnapshot.findMany({
    where: whereClause,
    orderBy: { date: "asc" },
  });

  let analytics: AnalyticsData;
  let dataSource: "snapshot" | "computed" | "empty" = "empty";

  // Strategy 1: Use snapshots if available - aggregate ALL snapshots for cumulative totals
  if (monthlySnapshots.length > 0) {
    analytics = aggregateAllSnapshots(monthlySnapshots, timeRange);
    dataSource = "snapshot";
  } else {
    // Strategy 2: Compute on-the-fly from database (fallback if no snapshots)
    const computedAnalytics = await computeAnalyticsFromDatabase(shop);

    if (computedAnalytics.totalOrders > 0) {
      analytics = computedAnalytics;
      dataSource = "computed";
    } else {
      // Strategy 3: Return empty state
      analytics = getEmptyAnalytics();
      dataSource = "empty";
    }
  }

  const data: LoaderData = {
    analytics,
    shop,
    syncStatus: {
      lastOrderSync: syncStatus?.lastOrderSync?.toISOString() || null,
      lastProductSync: syncStatus?.lastProductSync?.toISOString() || null,
      syncInProgress: syncStatus?.syncInProgress || false,
      totalOrders: syncStatus?.totalOrders || 0,
      totalProducts: syncStatus?.totalProducts || 0,
      hasData: (syncStatus?.totalOrders || 0) > 0,
    },
    dataSource,
    cacheHit: false,
    timeRange,
  };

  // Store in Redis cache (5 minute TTL)
  // Fire and forget - don't wait for cache write
  if (dataSource !== "empty") {
    cache.set(cacheKey, data, 300).catch((err) => {
      console.error("⚠️ Failed to cache analytics data:", err);
    });
  }

  const loadTime = Date.now() - startTime;
  console.log(`📊 Analytics dashboard loaded from DB in ${loadTime}ms using ${dataSource} data`);

  return Response.json(data, {
    headers: {
      "X-Cache": "MISS",
      "X-Load-Time": `${loadTime}ms`,
      "Cache-Control": "public, max-age=60", // Browser cache for 1 minute
    },
  });
}

/**
 * ACTION - Handle manual refresh button
 */
export async function action({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);

  // Redirect to sync page, then back to analytics
  return redirect("/app/sync?return=/app/analytics");
}

/**
 * Aggregate ALL snapshots to get cumulative totals across entire history
 */
function aggregateAllSnapshots(snapshots: any[], timeRange: string): AnalyticsData {
  let totalOrders = 0;
  let totalRevenue = 0;
  let fulfilledOrders = 0;
  let paidOrders = 0;

  const productMap = new Map<
    string,
    { name: string; quantity: number; revenue: number; orders: number }
  >();
  const locationMap = new Map<string, { orders: number; revenue: number }>();
  const customerSegmentsMap = {
    new: 0,
    returning: 0,
    vip: 0,
  };

  // Aggregate metrics from all snapshots
  snapshots.forEach((snapshot) => {
    totalOrders += snapshot.totalOrders;
    totalRevenue += snapshot.totalRevenue;
    fulfilledOrders += snapshot.fulfilledOrders;
    paidOrders += snapshot.paidOrders;

    // Aggregate products
    const snapshotProducts = snapshot.topProducts
      ? JSON.parse(snapshot.topProducts)
      : [];
    snapshotProducts.forEach((product: any) => {
      const existing = productMap.get(product.name) || {
        name: product.name,
        quantity: 0,
        revenue: 0,
        orders: 0,
      };
      existing.quantity += product.quantity || 0;
      existing.revenue += product.revenue || 0;
      existing.orders += product.orders || 0;
      productMap.set(product.name, existing);
    });

    // Aggregate locations
    const snapshotLocations = snapshot.topLocations
      ? JSON.parse(snapshot.topLocations)
      : [];
    snapshotLocations.forEach((location: any) => {
      const existing = locationMap.get(location.location) || {
        orders: 0,
        revenue: 0,
      };
      existing.orders += location.orders || 0;
      existing.revenue += location.revenue || 0;
      locationMap.set(location.location, existing);
    });

    // Aggregate customer segments
    const snapshotSegments = snapshot.customerSegments
      ? JSON.parse(snapshot.customerSegments)
      : { new: 0, returning: 0, vip: 0 };
    customerSegmentsMap.new += snapshotSegments.new || 0;
    customerSegmentsMap.returning += snapshotSegments.returning || 0;
    customerSegmentsMap.vip += snapshotSegments.vip || 0;
  });

  // Generate monthly data from daily snapshots
  const monthlyData = aggregateMonthlyData(snapshots, timeRange);

  // Sort and limit products
  const productData = Array.from(productMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Sort and limit locations
  const locationData = Array.from(locationMap, ([location, stats]) => ({
    location,
    ...stats,
  }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    fulfilledOrders,
    paidOrders,
    monthlyData,
    productData,
    customerSegments: customerSegmentsMap,
    locationData,
  };
}

/**
 * Aggregate daily snapshots into monthly data for trend chart
 */
function aggregateMonthlyData(snapshots: any[], timeRange: string): Array<{
  month: string;
  orders: number;
  revenue: number;
}> {
  const monthlyMap = new Map<string, { orders: number; revenue: number }>();

  snapshots.forEach((snapshot) => {
    const date = new Date(snapshot.date);
    const monthKey = date.toLocaleDateString("en", {
      year: "numeric",
      month: "short",
    });

    const existing = monthlyMap.get(monthKey) || { orders: 0, revenue: 0 };
    existing.orders += snapshot.totalOrders;
    existing.revenue += snapshot.totalRevenue;
    monthlyMap.set(monthKey, existing);
  });

  // Determine how many months to show based on time range
  let monthsToShow = 12;
  switch (timeRange) {
    case "1month":
      monthsToShow = 1;
      break;
    case "3months":
      monthsToShow = 3;
      break;
    case "6months":
      monthsToShow = 6;
      break;
    case "12months":
      monthsToShow = 12;
      break;
    case "year":
      monthsToShow = 12;
      break;
    case "alltime":
      // For all-time, return all available months from the data
      return Array.from(monthlyMap.entries())
        .sort((a, b) => {
          const dateA = new Date(a[0]);
          const dateB = new Date(b[0]);
          return dateA.getTime() - dateB.getTime();
        })
        .map(([month, data]) => ({
          month,
          orders: data.orders,
          revenue: data.revenue,
        }));
  }

  // Generate month labels for the specified range
  const months: string[] = [];
  const now = new Date();
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    months.push(
      d.toLocaleDateString("en", { year: "numeric", month: "short" })
    );
  }

  return months.map((month) => ({
    month,
    orders: monthlyMap.get(month)?.orders || 0,
    revenue: monthlyMap.get(month)?.revenue || 0,
  }));
}

/**
 * Fallback: Compute analytics from database orders (if no snapshots available)
 */
async function computeAnalyticsFromDatabase(
  shop: string
): Promise<AnalyticsData> {
  // Fetch last 100 orders for quick computation
  const orders = await db.order.findMany({
    where: { shop },
    include: { lineItems: true },
    orderBy: { processedAt: "desc" },
    take: 100,
  });

  if (orders.length === 0) {
    return getEmptyAnalytics();
  }

  // Aggregate metrics
  let totalRevenue = 0;
  let fulfilledCount = 0;
  let paidCount = 0;
  const productMap = new Map<
    string,
    { name: string; quantity: number; revenue: number; orders: number }
  >();
  const locationMap = new Map<string, { orders: number; revenue: number }>();
  const customerMap = new Map<string, number>();
  const monthlyMap = new Map<string, { orders: number; revenue: number }>();

  orders.forEach((order: any) => {
    totalRevenue += order.totalPrice;

    if (order.fulfillmentStatus === "FULFILLED") fulfilledCount++;
    if (order.financialStatus === "PAID") paidCount++;

    // Customer segmentation
    if (order.customerId) {
      customerMap.set(
        order.customerId,
        (customerMap.get(order.customerId) || 0) + 1
      );
    }

    // Monthly aggregation
    if (order.processedAt) {
      const monthKey = order.processedAt.toLocaleDateString("en", {
        year: "numeric",
        month: "short",
      });
      const monthData = monthlyMap.get(monthKey) || { orders: 0, revenue: 0 };
      monthData.orders += 1;
      monthData.revenue += order.totalPrice;
      monthlyMap.set(monthKey, monthData);
    }

    // Location aggregation
    if (order.shippingCity) {
      const location = order.shippingCity;
      const locData = locationMap.get(location) || { orders: 0, revenue: 0 };
      locData.orders += 1;
      locData.revenue += order.totalPrice;
      locationMap.set(location, locData);
    }

    // Product aggregation
    order.lineItems.forEach((item: any) => {
      const key = item.productTitle;
      const stats = productMap.get(key) || {
        name: key,
        quantity: 0,
        revenue: 0,
        orders: 0,
      };
      stats.quantity += item.quantity;
      stats.revenue += item.quantity * item.price;
      stats.orders += 1;
      productMap.set(key, stats);
    });
  });

  // Calculate customer segments
  let newCustomers = 0,
    returningCustomers = 0,
    vipCustomers = 0;
  customerMap.forEach((count) => {
    if (count === 1) newCustomers++;
    else if (count >= 5) vipCustomers++;
    else returningCustomers++;
  });

  return {
    totalOrders: orders.length,
    totalRevenue,
    averageOrderValue: totalRevenue / orders.length,
    fulfilledOrders: fulfilledCount,
    paidOrders: paidCount,
    monthlyData: Array.from(monthlyMap, ([month, data]) => ({
      month,
      ...data,
    })),
    productData: Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10),
    customerSegments: {
      new: newCustomers,
      returning: returningCustomers,
      vip: vipCustomers,
    },
    locationData: Array.from(locationMap, ([location, data]) => ({
      location,
      ...data,
    }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10),
  };
}

/**
 * Return empty analytics structure
 */
function getEmptyAnalytics(): AnalyticsData {
  return {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    fulfilledOrders: 0,
    paidOrders: 0,
    monthlyData: [],
    productData: [],
    customerSegments: { new: 0, returning: 0, vip: 0 },
    locationData: [],
  };
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  change?: number;
  icon: any;
  tone?: "default" | "success" | "warning";
};

function MetricCard({
  title,
  value,
  change,
  icon,
}: MetricCardProps) {
  const isPositive = typeof change === "number" && change > 0;

  return (
    <Card>
      <Box padding="400">
        <BlockStack gap="200">
          <InlineStack align="space-between">
            <Text variant="bodyMd" tone="subdued" as="span">
              {title}
            </Text>
            <Icon source={icon} tone="subdued" />
          </InlineStack>
          <Text variant="headingLg" as="h3">
            {value}
          </Text>
          {change !== undefined && (
            <InlineStack gap="100" align="start">
              <Icon
                source={isPositive ? ArrowUpIcon : ArrowDownIcon}
                tone={isPositive ? "success" : "critical"}
              />
              <Text
                variant="bodySm"
                tone={isPositive ? "success" : "critical"}
                as="span"
              >
                {Math.abs(change)}% {isPositive ? "increase" : "decrease"}
              </Text>
            </InlineStack>
          )}
        </BlockStack>
      </Box>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const { analytics, shop, syncStatus, dataSource, cacheHit, timeRange } =
    useLoaderData<LoaderData>();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    navigate("/app/sync?return=/app/analytics");
  }, [navigate]);

  const handleTimeRangeChange = useCallback((range: string) => {
    navigate(`/app/analytics?range=${range}`);
  }, [navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const COLORS = [
    "#5C6AC4",
    "#006FBB",
    "#47C1BF",
    "#50B83C",
    "#F49342",
    "#E3524F",
  ];

  // Show empty state if no data
  if (!syncStatus.hasData || dataSource === "empty") {
    return (
      <Page
        title="Analytics Dashboard"
        subtitle={`Analytics for ${shop}`}
        primaryAction={{
          content: "Sync Data",
          onAction: () => navigate("/app/sync"),
        }}
      >
        <Layout>
          <Layout.Section>
            <Banner
              title="No data available"
              tone="info"
              action={{ content: "Sync Orders", onAction: () => navigate("/app/sync") }}
            >
              <p>
                To view analytics, you need to sync your orders and products first.
                Click the button above to start syncing data from Shopify.
              </p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      title="Analytics Dashboard"
      subtitle={`Real-time insights for ${shop}`}
      primaryAction={{
        content: "Refresh Data",
        onAction: handleRefresh,
        loading: refreshing || syncStatus.syncInProgress,
        icon: RefreshIcon,
      }}
      secondaryActions={[
        {
          content: "Sync Data",
          onAction: () => navigate("/app/sync"),
        },
        {
          content: "Compute Analytics",
          onAction: () => navigate("/app/compute-analytics"),
        },
      ]}
    >
      <Layout>
        {/* Data Freshness Indicator */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="200" blockAlign="center">
                  <Icon source={ClockIcon} tone="subdued" />
                  <Text variant="bodyMd" as="span">
                    Last synced: {formatTimestamp(syncStatus.lastOrderSync)}
                  </Text>
                  {syncStatus.syncInProgress && (
                    <Badge tone="info">Syncing...</Badge>
                  )}
                  {cacheHit && (
                    <Badge tone="success">⚡ Cached</Badge>
                  )}
                  {!cacheHit && dataSource === "computed" && (
                    <Badge tone="warning">Live data (no snapshots)</Badge>
                  )}
                  {!cacheHit && dataSource === "snapshot" && (
                    <Badge tone="info">Pre-computed</Badge>
                  )}
                </InlineStack>
                <Text variant="bodySm" tone="subdued" as="span">
                  {syncStatus.totalOrders} orders • {syncStatus.totalProducts}{" "}
                  products in database
                </Text>
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Time Range Filter */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="bodyMd" as="span">
                  Time Range:
                </Text>
                <ButtonGroup variant="segmented">
                  <Button
                    pressed={timeRange === "1month"}
                    onClick={() => handleTimeRangeChange("1month")}
                  >
                    1 Month
                  </Button>
                  <Button
                    pressed={timeRange === "3months"}
                    onClick={() => handleTimeRangeChange("3months")}
                  >
                    3 Months
                  </Button>
                  <Button
                    pressed={timeRange === "6months"}
                    onClick={() => handleTimeRangeChange("6months")}
                  >
                    6 Months
                  </Button>
                  <Button
                    pressed={timeRange === "year"}
                    onClick={() => handleTimeRangeChange("year")}
                  >
                    This Year
                  </Button>
                  <Button
                    pressed={timeRange === "12months"}
                    onClick={() => handleTimeRangeChange("12months")}
                  >
                    12 Months
                  </Button>
                  <Button
                    pressed={timeRange === "alltime"}
                    onClick={() => handleTimeRangeChange("alltime")}
                  >
                    All Time
                  </Button>
                </ButtonGroup>
              </InlineStack>
            </Box>
          </Card>
        </Layout.Section>

        {/* Key Metrics Section */}
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Key Performance Metrics
            </Text>
            <InlineGrid
              columns={{ xs: 1, sm: 2, md: 2, lg: 4, xl: 4 }}
              gap="400"
            >
              <MetricCard
                title="Total Orders"
                value={formatNumber(analytics.totalOrders)}
                icon={PackageIcon}
              />
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(analytics.totalRevenue)}
                icon={CashDollarIcon}
                tone="success"
              />
              <MetricCard
                title="Average Order Value"
                value={formatCurrency(analytics.averageOrderValue)}
                icon={ArrowUpIcon}
              />
              <MetricCard
                title="Fulfillment Rate"
                value={
                  analytics.totalOrders > 0
                    ? `${Math.round(
                        (analytics.fulfilledOrders / analytics.totalOrders) *
                          100
                      )}%`
                    : "0%"
                }
                icon={PackageIcon}
              />
            </InlineGrid>
          </BlockStack>
        </Layout.Section>

        {/* Monthly Trend Chart */}
        {analytics.monthlyData.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Monthly Sales Trend
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name) => {
                          if (name === "revenue")
                            return formatCurrency(value as number);
                          return value;
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#5C6AC4"
                        fill="#5C6AC4"
                        fillOpacity={0.6}
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="orders"
                        stroke="#50B83C"
                        fill="#50B83C"
                        fillOpacity={0.6}
                        name="Orders"
                        yAxisId="right"
                      />
                      <YAxis yAxisId="right" orientation="right" />
                    </AreaChart>
                  </ResponsiveContainer>
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Product Performance and Customer Segments */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            {/* Top Products */}
            {analytics.productData.length > 0 && (
              <Card>
                <Box padding="400">
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h2">
                      Top Products by Quantity
                    </Text>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.productData.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                          interval={0}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#5C6AC4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </BlockStack>
                </Box>
              </Card>
            )}

            {/* Customer Segments */}
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Customer Segments
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "New",
                            value: analytics.customerSegments.new,
                          },
                          {
                            name: "Returning",
                            value: analytics.customerSegments.returning,
                          },
                          {
                            name: "VIP (5+ orders)",
                            value: analytics.customerSegments.vip,
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name ?? ""} ${
                            props.percent !== undefined
                              ? (props.percent * 100).toFixed(0)
                              : "0"
                          }%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell key="cell-0" fill={COLORS[0]} />
                        <Cell key="cell-1" fill={COLORS[1]} />
                        <Cell key="cell-2" fill={COLORS[2]} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <InlineStack gap="400" align="center">
                    <Badge tone="info">{`New: ${analytics.customerSegments.new}`}</Badge>
                    <Badge tone="success">{`Returning: ${analytics.customerSegments.returning}`}</Badge>
                    <Badge tone="attention">{`VIP: ${analytics.customerSegments.vip}`}</Badge>
                  </InlineStack>
                </BlockStack>
              </Box>
            </Card>
          </InlineGrid>
        </Layout.Section>

        {/* Location Analysis */}
        {analytics.locationData.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Top Locations by Orders
                  </Text>
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric"]}
                    headings={["Location", "Orders", "Revenue"]}
                    rows={analytics.locationData.map((loc) => [
                      loc.location,
                      loc.orders.toString(),
                      formatCurrency(loc.revenue),
                    ])}
                    sortable={[true, true, true]}
                  />
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}

        {/* Product Details Table */}
        {analytics.productData.length > 0 && (
          <Layout.Section>
            <Card>
              <Box padding="400">
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Product Performance Details
                  </Text>
                  <DataTable
                    columnContentTypes={[
                      "text",
                      "numeric",
                      "numeric",
                      "numeric",
                    ]}
                    headings={[
                      "Product",
                      "Quantity Sold",
                      "Orders",
                      "Revenue",
                    ]}
                    rows={analytics.productData.map((product) => [
                      product.name,
                      product.quantity.toString(),
                      product.orders.toString(),
                      formatCurrency(product.revenue),
                    ])}
                    sortable={[true, true, true, true]}
                  />
                </BlockStack>
              </Box>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
