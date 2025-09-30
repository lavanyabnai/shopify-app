import { useState, useCallback } from 'react';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Select,
  Button,
  BlockStack,
  InlineStack,
  Box,
  ButtonGroup,
  Tabs,
  DataTable,
} from '@shopify/polaris';
import {
  ExportIcon,
} from '@shopify/polaris-icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  ComposedChart,
} from 'recharts';

// Types
interface ProductionData {
  week: string;
  production: number;
}

interface ProductGroupMetrics {
  productGroup: string;
  otifCommit: number;
  orderLinesMissed: number;
  endCustomerBackorders: number;
  weeklyStatus: string;
}

interface SKUProduction {
  sku: string;
  productGroup: string;
  weeklyProduction: { [week: string]: number };
}

interface SupplyData {
  productionOverTime: ProductionData[];
  serviceMetrics: ProductGroupMetrics[];
  skuProduction: SKUProduction[];
  summary: {
    totalProduction: number;
    avgOTIF: number;
    criticalProducts: number;
    productionCapacity: number;
  };
}

// Polaris color palette
const POLARIS_COLORS = {
  primary: '#008060',
  secondary: '#5C6AC4',
  tertiary: '#006FBB',
  critical: '#D82C0D',
  warning: '#FFC453',
  success: '#008060',
  subdued: '#6D7175',
  border: '#C9CCCF',
  surface: '#F6F6F7',
  text: '#202223',
  productionBar: '#00A0AC',
};

// Loader
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  
  // Generate production over time data
  const generateProductionData = (): ProductionData[] => {
    const weeks = [
      'Oct 15-18', 'Oct 15-18', 'Oct 22-18', 'Oct 29-18', 'Nov 05-18', 'Nov 12-18',
      'Nov 19-18', 'Nov 26-18', 'Dec 03-18', 'Dec 10-18', 'Dec 17-18', 'Dec 24-18',
      'Dec 31-18', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6',
      'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'
    ];
    
    return weeks.map((week, index) => ({
      week,
      production: index < 13 ? 100000 + Math.random() * 50000 : 80000 + Math.random() * 40000,
    }));
  };

  // Generate service metrics
  const serviceMetrics: ProductGroupMetrics[] = [
    { productGroup: 'Product01', otifCommit: 46, orderLinesMissed: 70, endCustomerBackorders: 46000, weeklyStatus: 'Critical' },
    { productGroup: 'Product02', otifCommit: 52, orderLinesMissed: 65, endCustomerBackorders: 38000, weeklyStatus: 'Warning' },
    { productGroup: 'Product03', otifCommit: 68, orderLinesMissed: 45, endCustomerBackorders: 25000, weeklyStatus: 'Warning' },
    { productGroup: 'Product04', otifCommit: 75, orderLinesMissed: 35, endCustomerBackorders: 18000, weeklyStatus: 'Normal' },
    { productGroup: 'Product05', otifCommit: 82, orderLinesMissed: 28, endCustomerBackorders: 12000, weeklyStatus: 'Normal' },
    { productGroup: 'Product06', otifCommit: 78, orderLinesMissed: 32, endCustomerBackorders: 15000, weeklyStatus: 'Normal' },
    { productGroup: 'Product07', otifCommit: 85, orderLinesMissed: 22, endCustomerBackorders: 8000, weeklyStatus: 'Good' },
    { productGroup: 'Product08', otifCommit: 88, orderLinesMissed: 18, endCustomerBackorders: 6000, weeklyStatus: 'Good' },
    { productGroup: 'Product09', otifCommit: 91, orderLinesMissed: 15, endCustomerBackorders: 4000, weeklyStatus: 'Good' },
    { productGroup: 'Product10', otifCommit: 94, orderLinesMissed: 10, endCustomerBackorders: 2000, weeklyStatus: 'Excellent' },
  ];

  // Generate SKU production data
  const skuProduction: SKUProduction[] = [
    { sku: 's00018', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00022', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00023', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00024', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00030', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00043', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00051', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00068', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00070', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00075', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00079', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00088', productGroup: 'Product G', weeklyProduction: {} },
    { sku: 's00107', productGroup: 'Product G', weeklyProduction: {} },
  ];

  const weeks2018 = ['Week 41', 'Week 42', 'Week 43', 'Week 44', 'Week 45', 'Week 46', 'Week 47', 'Week 48', 'Week 49', 'Week 50', 'Week 51', 'Week 52'];
  const weeks2019 = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'];

  skuProduction.forEach(sku => {
    weeks2018.forEach(week => {
      sku.weeklyProduction[`2018-${week}`] = Math.floor(Math.random() * 2000) + 100;
    });
    weeks2019.forEach(week => {
      sku.weeklyProduction[`2019-${week}`] = Math.floor(Math.random() * 2000) + 100;
    });
  });

  const supplyData: SupplyData = {
    productionOverTime: generateProductionData(),
    serviceMetrics,
    skuProduction,
    summary: {
      totalProduction: 2500000,
      avgOTIF: 75.5,
      criticalProducts: 3,
      productionCapacity: 85,
    },
  };

  return json(supplyData);
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        border: `1px solid ${POLARIS_COLORS.border}`,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px', color: POLARIS_COLORS.text }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ fontSize: '12px', color: entry.color, margin: '4px 0' }}>
            {entry.name}: {entry.value?.toLocaleString() || 0}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ActionIncreaseSupplyDashboard() {
  const data = useLoaderData<SupplyData>();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedProductGroup, setSelectedProductGroup] = useState('all');
  const [selectedView, setSelectedView] = useState('chart');

  const handleTabChange = useCallback((selectedTabIndex: number) => setSelectedTab(selectedTabIndex), []);
  const handleProductGroupChange = useCallback((value: string) => setSelectedProductGroup(value), []);
  const handleViewChange = useCallback((value: string) => setSelectedView(value), []);

  // Prepare service metrics chart data
  const serviceChartData = data.serviceMetrics.map(metric => ({
    productGroup: metric.productGroup,
    'OTIF at commit': metric.otifCommit,
    'Order lines missed': metric.orderLinesMissed,
    'End-customer backorders': metric.endCustomerBackorders / 1000, // Scale for visualization
  }));

  // Prepare SKU production table
  const allWeeks = Object.keys(data.skuProduction[0]?.weeklyProduction || {});
  const tableHeadings = ['Product G', 'SKU', ...allWeeks];
  const tableRows = data.skuProduction.map(sku => [
    sku.productGroup,
    sku.sku,
    ...allWeeks.map(week => sku.weeklyProduction[week]?.toLocaleString() || '-'),
  ]);

  const tabs = [
    { id: 'overview', content: 'Overview', accessibilityLabel: 'Overview' },
    { id: 'production', content: 'Production Details', accessibilityLabel: 'Production' },
    { id: 'sku-breakdown', content: 'SKU Breakdown', accessibilityLabel: 'SKU' },
  ];

  return (
    <Page
      title="Action: Increase Supply"
      subtitle="Production planning and service metrics analysis"
      primaryAction={{
        content: 'Export Report',
        icon: ExportIcon,
        onAction: () => console.log('Export report'),
      }}
      secondaryActions={[
        {
          content: 'Adjust Production Plan',
          onAction: () => console.log('Adjust plan'),
        },
        {
          content: 'Request Capacity',
          onAction: () => console.log('Request capacity'),
        },
      ]}
    >
      <Layout>
        {/* Summary Metrics */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Production
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {(data.summary.totalProduction / 1000000).toFixed(2)}M
                  </Text>
                  <Badge tone="success">Target met</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Average OTIF
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.avgOTIF}%
                  </Text>
                  <Badge tone="warning">Below target</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Critical Products
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.criticalProducts}
                  </Text>
                  <Badge tone="critical">Needs attention</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Production Capacity
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.productionCapacity}%
                  </Text>
                  <Badge tone="info">15% available</Badge>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Filters */}
        <Layout.Section>
          <Card>
            <InlineStack gap="400">
              <Box minWidth="200px">
                <Select
                  label="Product Group"
                  options={[
                    { label: 'All Products', value: 'all' },
                    ...data.serviceMetrics.map(m => ({
                      label: m.productGroup,
                      value: m.productGroup,
                    })),
                  ]}
                  value={selectedProductGroup}
                  onChange={handleProductGroupChange}
                />
              </Box>
              <Box>
                <Text as="p" variant="bodySm" fontWeight="medium">
                  View Mode
                </Text>
                <Box paddingBlockStart="200">
                  <ButtonGroup variant="segmented">
                    <Button
                      pressed={selectedView === 'chart'}
                      onClick={() => setSelectedView('chart')}
                    >
                      Chart View
                    </Button>
                    <Button
                      pressed={selectedView === 'table'}
                      onClick={() => setSelectedView('table')}
                    >
                      Table View
                    </Button>
                  </ButtonGroup>
                </Box>
              </Box>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Main Content */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              <Box padding="400">
                {selectedTab === 0 && (
                  <Layout>
                    {/* Production Over Time */}
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <BlockStack gap="200">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">
                              Production per product group over time
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              Weekly production volumes across all product groups
                            </Text>
                          </BlockStack>

                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data.productionOverTime}>
                              <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                              <XAxis
                                dataKey="week"
                                tick={{ fontSize: 10, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                              />
                              <YAxis
                                tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Bar dataKey="production" fill={POLARIS_COLORS.productionBar} name="Production" />
                            </BarChart>
                          </ResponsiveContainer>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    {/* Service Metrics */}
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <BlockStack gap="200">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">
                              Service metrics by product group
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              OTIF performance and backorder analysis
                            </Text>
                          </BlockStack>

                          <ResponsiveContainer width="100%" height={450}>
                            <BarChart
                              data={serviceChartData}
                              layout="vertical"
                              margin={{ left: 20 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                              />
                              <YAxis
                                type="category"
                                dataKey="productGroup"
                                tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                                width={80}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Bar dataKey="OTIF at commit" fill={POLARIS_COLORS.tertiary} name="OTIF at commit" />
                              <Bar dataKey="Order lines missed" fill={POLARIS_COLORS.warning} name="Order lines missed" />
                              <Bar dataKey="End-customer backorders" fill={POLARIS_COLORS.critical} name="End-customer backorders (K)" />
                            </BarChart>
                          </ResponsiveContainer>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 1 && (
                  <Layout>
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Production Capacity Analysis
                          </Text>
                          
                          <BlockStack gap="300">
                            {data.serviceMetrics.map((metric, index) => (
                              <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                                <BlockStack gap="200">
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                                      {metric.productGroup}
                                    </Text>
                                    <Badge tone={
                                      metric.weeklyStatus === 'Excellent' ? 'success' :
                                      metric.weeklyStatus === 'Good' ? 'info' :
                                      metric.weeklyStatus === 'Normal' ? 'info' :
                                      metric.weeklyStatus === 'Warning' ? 'warning' : 'critical'
                                    }>
                                      {metric.weeklyStatus}
                                    </Badge>
                                  </InlineStack>
                                  
                                  <InlineStack gap="600" wrap>
                                    <InlineStack gap="100">
                                      <Text as="span" variant="bodySm" tone="subdued">
                                        OTIF:
                                      </Text>
                                      <Text as="span" variant="bodySm" fontWeight="semibold">
                                        {metric.otifCommit}%
                                      </Text>
                                    </InlineStack>
                                    <InlineStack gap="100">
                                      <Text as="span" variant="bodySm" tone="subdued">
                                        Missed:
                                      </Text>
                                      <Text as="span" variant="bodySm" fontWeight="semibold">
                                        {metric.orderLinesMissed}
                                      </Text>
                                    </InlineStack>
                                    <InlineStack gap="100">
                                      <Text as="span" variant="bodySm" tone="subdued">
                                        Backorders:
                                      </Text>
                                      <Text as="span" variant="bodySm" fontWeight="semibold">
                                        {metric.endCustomerBackorders.toLocaleString()}
                                      </Text>
                                    </InlineStack>
                                  </InlineStack>
                                </BlockStack>
                              </Box>
                            ))}
                          </BlockStack>

                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              Recommendations:
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              • Increase production capacity for Product01, Product02, and Product03
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              • Consider shifting resources from high-performing products
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              • Review demand forecasts for critical products
                            </Text>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 2 && (
                  <Layout>
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <InlineStack align="space-between">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">
                              Production by SKU in product group
                            </Text>
                            <Badge tone="info">{`${data.skuProduction.length} SKUs`}</Badge>
                          </InlineStack>
                          
                          <Box>
                            <div style={{ overflowX: 'auto' }}>
                              <DataTable
                                columnContentTypes={[
                                  'text',
                                  'text',
                                  ...allWeeks.map(() => 'numeric' as const),
                                ]}
                                headings={tableHeadings}
                                rows={tableRows}
                                hoverable
                                footerContent={
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Showing weekly production data for {data.skuProduction.length} SKUs across {allWeeks.length} weeks
                                  </Text>
                                }
                              />
                            </div>
                          </Box>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>

        {/* Action Items */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                Quick Actions
              </Text>
              <BlockStack gap="200">
                <Button fullWidth>Increase Production Capacity</Button>
                <Button fullWidth variant="plain">Review Resource Allocation</Button>
                <Button fullWidth variant="plain">Analyze Production Efficiency</Button>
                <Button fullWidth variant="plain">Generate Supply Plan</Button>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
