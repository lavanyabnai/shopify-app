import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
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
  DataTable,
  Select,
  DatePicker,
  Button,
  Icon,
  InlineStack,
} from "@shopify/polaris";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  PackageIcon,
  CashDollarIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import { useState, useCallback, useEffect } from "react";
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

// GraphQL queries
const ORDERS_ANALYTICS_QUERY = `
  query GetOrdersAnalytics($first: Int!, $query: String, $after: String) {
    orders(first: $first, query: $query, after: $after) {
      edges {
        node {
          id
          name
          createdAt
          processedAt
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          displayFulfillmentStatus
          displayFinancialStatus
          customer {
            id
          }
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                quantity
                product {
                  id
                  title
                  productType
                  vendor
                }
                variant {
                  id
                  title
                  price
                }
              }
            }
          }
          shippingAddress {
            city
            province
            country
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          productType
          vendor
          totalInventory
          priceRangeV2 {
            minVariantPrice {
              amount
            }
          }
        }
      }
    }
  }
`;

const LOCATIONS_QUERY = `
  query GetLocations {
    locations(first: 10) {
      edges {
        node {
          id
          name
          address {
            city
            province
            country
          }
        }
      }
    }
  }
`;

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

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function loader({ request }: { request: Request }) {
  const { admin, session } = await authenticate.admin(request);

  // Fetch orders for 2025 using pagination (filtered by processed date)
  // Limit to prevent timeouts - fetch max 20 pages (5000 orders)
  let allOrders: any[] = [];
  let hasNextPage = true;
  let cursor = null;
  const query2025 = "processed_at:>=2025-01-01 AND processed_at:<2026-01-01";
  let pageCount = 0;
  const MAX_PAGES = 20; // Limit to 5000 orders max to prevent timeouts

  while (hasNextPage && pageCount < MAX_PAGES) {
    let retryCount = 0;
    const maxRetries = 3;
    let success = false;
    
    while (!success && retryCount <= maxRetries) {
      try {
        const variables: any = { first: 250, query: query2025 };
        if (cursor) {
          variables.after = cursor;
        }
        
        // Add delay before each request (more aggressive rate limiting)
        if (pageCount > 0) {
          await delay(1500); // 1.5 second delay between pagination requests
        }
        
        const ordersResponse = await admin.graphql(ORDERS_ANALYTICS_QUERY, {
          variables
        });
        
        const ordersData: any = await ordersResponse.json();
        
        // Check for GraphQL errors
        if (ordersData.errors && ordersData.errors.length > 0) {
          console.error('GraphQL errors:', ordersData.errors);
          const errorMessage = ordersData.errors[0].message;
          if (errorMessage.includes('Throttled')) {
            throw new Error('Throttled');
          }
          throw new Error(`GraphQL Error: ${errorMessage}`);
        }
        
        // Validate response structure
        if (!ordersData || !ordersData.data || !ordersData.data.orders) {
          console.error('Invalid response structure:', ordersData);
          throw new Error('Invalid GraphQL response structure');
        }
        
        const edges = ordersData.data.orders.edges || [];
        allOrders = allOrders.concat(edges);
        
        hasNextPage = ordersData.data.orders.pageInfo?.hasNextPage || false;
        cursor = ordersData.data.orders.pageInfo?.endCursor || null;
        pageCount++;
        
        success = true; // Mark as successful
        
        console.log(`Fetched page ${pageCount}, total orders: ${allOrders.length}`);
        
      } catch (error: any) {
        const errorMessage = error.message || String(error);
        
        // Handle different types of errors with retry logic
        if ((errorMessage.includes('Throttled') || errorMessage.includes('fetch failed')) && retryCount < maxRetries) {
          retryCount++;
          const waitTime = 4000 * retryCount; // 4s, 8s, 12s
          console.log(`Error on page ${pageCount + 1}: ${errorMessage}. Waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}...`);
          await delay(waitTime);
        } else if (retryCount < maxRetries) {
          retryCount++;
          const waitTime = 3000 * retryCount;
          console.log(`Error on page ${pageCount + 1}: ${errorMessage}. Waiting ${waitTime}ms before retry ${retryCount}/${maxRetries}...`);
          await delay(waitTime);
        } else {
          console.error('Failed to fetch orders after retries:', errorMessage);
          // Don't throw - just break and use what we have
          break;
        }
      }
    }
    
    if (!success) {
      console.log(`Stopping pagination after ${pageCount} pages due to errors. Using ${allOrders.length} orders.`);
      break;
    }
  }
  
  if (pageCount >= MAX_PAGES) {
    console.log(`Reached maximum page limit (${MAX_PAGES}). Total orders fetched: ${allOrders.length}`);
  } else {
    console.log(`Finished fetching orders. Total: ${allOrders.length}`);
  }
  
  // Add delay before fetching products
  await delay(1500);
  
  let productsData: any = { data: { products: { edges: [] } } };
  try {
    const productsResponse = await admin.graphql(PRODUCTS_QUERY, {
      variables: { first: 100 }
    });
    productsData = await productsResponse.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
  }
  
  // Add delay before fetching locations
  await delay(1500);
  
  let locationsData: any = { data: { locations: { edges: [] } } };
  try {
    const locationsResponse = await admin.graphql(LOCATIONS_QUERY);
    locationsData = await locationsResponse.json();
  } catch (error) {
    console.error('Failed to fetch locations:', error);
  }
  
  // Process analytics data for all of 2025
  const analytics = processAnalyticsData(allOrders);
  
  return json({
    analytics,
    products: productsData.data.products.edges,
    locations: locationsData.data.locations.edges,
    shop: session.shop,
  });
}

function processAnalyticsData(orders: any[]): AnalyticsData {
  // Initialize all months of 2025
  const monthlyStats = new Map();
  const months2025 = [
    'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 
    'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 
    'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025'
  ];
  months2025.forEach(month => {
    monthlyStats.set(month, { orders: 0, revenue: 0 });
  });
  
  const productStats = new Map();
  const customerOrders = new Map();
  const locationStats = new Map();
  
  let totalRevenue = 0;
  let fulfilledCount = 0;
  let paidCount = 0;
  
  orders.forEach(({ node: order }) => {
    const amount = parseFloat(order.totalPriceSet.shopMoney.amount);
    totalRevenue += amount;
    
    // Monthly aggregation based on processedAt date
    if (order.processedAt) {
      const month = new Date(order.processedAt).toLocaleDateString('en', { 
        year: 'numeric', 
        month: 'short' 
      });
      const monthData = monthlyStats.get(month) || { orders: 0, revenue: 0 };
      monthData.orders += 1;
      monthData.revenue += amount;
      monthlyStats.set(month, monthData);
    }
    
    // Order status
    if (order.displayFulfillmentStatus === 'FULFILLED') fulfilledCount++;
    if (order.displayFinancialStatus === 'PAID') paidCount++;
    
    // Customer segmentation
    if (order.customer) {
      const customerId = order.customer.id;
      const orderCount = customerOrders.get(customerId) || 0;
      customerOrders.set(customerId, orderCount + 1);
    }

    // Product analysis
    order.lineItems.edges.forEach((edge: { node: any }) => {
      const item = edge.node;
      const product = item.product;
      if (product) {
        const key = product.title;
        const stats = productStats.get(key) || {
          name: key,
          quantity: 0,
          revenue: 0,
          orders: 0,
        };
        stats.quantity += item.quantity;
        stats.revenue += item.quantity * parseFloat(item.variant.price);
        stats.orders += 1;
        productStats.set(key, stats);
      }
    });
    
    // Location analysis
    if (order.shippingAddress) {
      const location = order.shippingAddress.city || 'Unknown';
      const locData = locationStats.get(location) || { orders: 0, revenue: 0 };
      locData.orders += 1;
      locData.revenue += amount;
      locationStats.set(location, locData);
    }
  });
  
  // Calculate customer segments
  let newCustomers = 0, returningCustomers = 0, vipCustomers = 0;
  customerOrders.forEach((count) => {
    if (count === 1) newCustomers++;
    else if (count >= 5) vipCustomers++;
    else returningCustomers++;
  });
  
  // Convert maps to arrays (maintaining order for all 12 months of 2025)
  const monthlyData = Array.from(monthlyStats, ([month, data]) => ({
    month,
    ...data,
  }));
  
  const productData = Array.from(productStats.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  
  const locationData = Array.from(locationStats, ([location, data]) => ({
    location,
    ...data,
  }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 10);
  
  return {
    totalOrders: orders.length,
    totalRevenue,
    averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    fulfilledOrders: fulfilledCount,
    paidOrders: paidCount,
    monthlyData,
    productData,
    customerSegments: {
      new: newCustomers,
      returning: returningCustomers,
      vip: vipCustomers,
    },
    locationData,
  };
}

// Metric Card Component
type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  change?: number;
  icon: any;
  tone?: "default" | "success" | "warning";
};

function MetricCard({ title, value, change, icon, tone = "default" }: MetricCardProps) {
  const isPositive = typeof change === "number" && change > 0;
  const toneColor = tone === "success" ? "success" : tone === "warning" ? "warning" : "default";
  
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
              <Text variant="bodySm" tone={isPositive ? "success" : "critical"} as="span">
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
  const { analytics, shop } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("30days");
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Trigger a page refresh to reload data
    navigate(".", { replace: true });
    setTimeout(() => setRefreshing(false), 1000);
  }, [navigate]);
  
  // Filter monthly data based on selected period
  const getFilteredMonthlyData = useCallback(() => {
    if (selectedPeriod === "year") {
      // Show all months for year view
      return analytics.monthlyData;
    }
    
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11 (Sep = 8)
    const currentYear = now.getFullYear();
    
    let monthsToShow: number;
    
    switch (selectedPeriod) {
      case "30days":
        monthsToShow = 1;
        break;
      case "3months":
        monthsToShow = 3;
        break;
      case "6months":
        monthsToShow = 6;
        break;
      default:
        monthsToShow = 12;
    }
    
    // Get the month names we want to show
    const monthsToInclude: string[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Calculate which months to show (going backwards from current month)
    for (let i = 0; i < monthsToShow; i++) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      
      // Handle year boundary
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }
      
      monthsToInclude.push(`${monthNames[targetMonth]} ${targetYear}`);
    }
    
    // Filter and reverse to show chronologically
    const filtered = analytics.monthlyData.filter((data) => 
      monthsToInclude.includes(data.month)
    );
    
    // Sort by date to ensure proper order
    return filtered.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
  }, [selectedPeriod, analytics.monthlyData]);
  
  const filteredMonthlyData = getFilteredMonthlyData();
  
  const COLORS = ['#5C6AC4', '#006FBB', '#47C1BF', '#50B83C', '#F49342', '#E3524F'];
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format number
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  return (
    <Page
      title="Analytics Dashboard"
      subtitle={`Real-time insights for ${shop}`}
      primaryAction={
        <Button
          onClick={handleRefresh}
          loading={refreshing}
          icon={RefreshIcon}
        >
          Refresh Data
        </Button>
      }
      secondaryActions={[
        {
          content: "Export Report",
          onAction: () => console.log("Export report"),
        },
        {
          content: "Configure Alerts",
          onAction: () => navigate("/app/control-tower"),
        },
      ]}
    >
      <Layout>
        {/* Key Metrics Section */}
        <Layout.Section>
          <BlockStack gap="400">
            <Text variant="headingMd" as="h2">
              Key Performance Metrics
            </Text>
            <InlineGrid columns={{ xs: 1, sm: 2, md: 2, lg: 4, xl: 4 }} gap="400">
              <MetricCard
                title="Total Orders"
                value={formatNumber(analytics.totalOrders)}
                change={12.5}
                icon={PackageIcon}
              />
              <MetricCard
                title="Total Revenue"
                value={formatCurrency(analytics.totalRevenue)}
                change={18.3}
                icon={CashDollarIcon}
                tone="success"
              />
              <MetricCard
                title="Average Order Value"
                value={formatCurrency(analytics.averageOrderValue)}
                change={-5.2}
                icon={ArrowUpIcon}
              />
              <MetricCard
                title="Fulfillment Rate"
                value={`${Math.round((analytics.fulfilledOrders / analytics.totalOrders) * 100)}%`}
                change={8.7}
                icon={PackageIcon}
              />
            </InlineGrid>
          </BlockStack>
        </Layout.Section>
        
        {/* Monthly Trend Chart */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <InlineStack align="space-between">
                  <Text variant="headingMd" as="h2">
                    Monthly Sales Trend
                  </Text>
                  <Select
                    label="Period"
                    labelHidden
                    options={[
                      { label: "Last 30 days", value: "30days" },
                      { label: "Last 3 months", value: "3months" },
                      { label: "Last 6 months", value: "6months" },
                      { label: "Last year", value: "year" },
                    ]}
                    value={selectedPeriod}
                    onChange={setSelectedPeriod}
                  />
                </InlineStack>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={filteredMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'revenue') return formatCurrency(value as number);
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
        
        {/* Product Performance and Customer Segments */}
        <Layout.Section>
          <InlineGrid columns={{ xs: 1, md: 2 }} gap="400">
            {/* Top Products */}
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
                          { name: 'New', value: analytics.customerSegments.new },
                          { name: 'Returning', value: analytics.customerSegments.returning },
                          { name: 'VIP (5+ orders)', value: analytics.customerSegments.vip },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name ?? ''} ${props.percent !== undefined ? (props.percent * 100).toFixed(0) : '0'}%`
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
                  rows={analytics.locationData.map(loc => [
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
        
        {/* Product Details Table */}
        <Layout.Section>
          <Card>
            <Box padding="400">
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">
                  Product Performance Details
                </Text>
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                  headings={["Product", "Quantity Sold", "Orders", "Revenue"]}
                  rows={analytics.productData.map(product => [
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
      </Layout>
    </Page>
  );
}