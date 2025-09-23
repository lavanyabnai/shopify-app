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
  query GetOrdersAnalytics($first: Int!, $query: String) {
    orders(first: $first, query: $query) {
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

export async function loader({ request }: { request: Request }) {
  const { admin, session } = await authenticate.admin(request);

  // Fetch all necessary data
  const ordersResponse = await admin.graphql(ORDERS_ANALYTICS_QUERY, {
    variables: { first: 250, query: "created_at:>2024-01-01" }
  });
  
  const productsResponse = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first: 100 }
  });
  
  const locationsResponse = await admin.graphql(LOCATIONS_QUERY);
  
  const ordersData = await ordersResponse.json();
  const productsData = await productsResponse.json();
  const locationsData = await locationsResponse.json();
  
  // Process analytics data
  const analytics = processAnalyticsData(ordersData.data.orders.edges);
  
  return json({
    analytics,
    products: productsData.data.products.edges,
    locations: locationsData.data.locations.edges,
    shop: session.shop,
  });
}

function processAnalyticsData(orders: any[]): AnalyticsData {
  const monthlyStats = new Map();
  const productStats = new Map();
  const customerOrders = new Map();
  const locationStats = new Map();
  
  let totalRevenue = 0;
  let fulfilledCount = 0;
  let paidCount = 0;
  
  orders.forEach(({ node: order }) => {
    const amount = parseFloat(order.totalPriceSet.shopMoney.amount);
    totalRevenue += amount;
    
    // Monthly aggregation
    const month = new Date(order.createdAt).toLocaleDateString('en', { 
      year: 'numeric', 
      month: 'short' 
    });
    const monthData = monthlyStats.get(month) || { orders: 0, revenue: 0 };
    monthData.orders += 1;
    monthData.revenue += amount;
    monthlyStats.set(month, monthData);
    
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
  
  // Convert maps to arrays
  const monthlyData = Array.from(monthlyStats, ([month, data]) => ({
    month,
    ...data,
  })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  
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
                  <AreaChart data={analytics.monthlyData}>
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