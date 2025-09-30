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
  Cell,
} from 'recharts';

// Types
interface ProductGroupExcess {
  productGroup: string;
  excessInventory: number;
  excessValue: number;
}

interface SKUInventorySplit {
  sku: string;
  productGroup: string;
  excess: number;
  excessValue: number;
  daysOfSales: number;
  comparison: 'excess' | 'onTarget' | 'atRisk';
}

interface ExcessData {
  productGroups: ProductGroupExcess[];
  skuDetails: SKUInventorySplit[];
  summary: {
    totalExcessInventory: number;
    totalExcessValue: number;
    criticalSKUs: number;
    avgDaysOfSales: number;
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
  excess: '#E84C3D',
  onTarget: '#00A0AC',
  atRisk: '#7B68A6',
};

// Loader
export const loader: LoaderFunction = async ({ request }) => {
  // Generate product group excess data
  const productGroups: ProductGroupExcess[] = [
    { productGroup: 'Product G', excessInventory: 10500, excessValue: 75000 },
    { productGroup: 'Product H', excessInventory: 9800, excessValue: 68000 },
    { productGroup: 'Product01', excessInventory: 4200, excessValue: 52000 },
    { productGroup: 'Product02', excessInventory: 3800, excessValue: 48000 },
    { productGroup: 'Product03', excessInventory: 2900, excessValue: 38000 },
    { productGroup: 'Product04', excessInventory: 2100, excessValue: 28000 },
    { productGroup: 'Product05', excessInventory: 1500, excessValue: 18000 },
    { productGroup: 'Product06', excessInventory: 1200, excessValue: 15000 },
    { productGroup: 'Product07', excessInventory: 800, excessValue: 10000 },
    { productGroup: 'Product08', excessInventory: 500, excessValue: 6000 },
  ];

  // Generate SKU inventory split data
  const skuDetails: SKUInventorySplit[] = [
    { sku: 's00118', productGroup: 'Product G', excess: 1200, excessValue: 8500, daysOfSales: 85, comparison: 'atRisk' },
    { sku: 's00113', productGroup: 'Product G', excess: -200, excessValue: 0, daysOfSales: 15, comparison: 'onTarget' },
    { sku: 's00124', productGroup: 'Product G', excess: 800, excessValue: 6200, daysOfSales: 65, comparison: 'atRisk' },
    { sku: 's00134', productGroup: 'Product G', excess: -100, excessValue: 0, daysOfSales: 12, comparison: 'onTarget' },
    { sku: 's00144', productGroup: 'Product G', excess: 950, excessValue: 7100, daysOfSales: 72, comparison: 'atRisk' },
    { sku: 's00154', productGroup: 'Product G', excess: 300, excessValue: 2800, daysOfSales: 35, comparison: 'onTarget' },
    { sku: 's00162', productGroup: 'Product G', excess: -150, excessValue: 0, daysOfSales: 10, comparison: 'onTarget' },
    { sku: 's00168', productGroup: 'Product G', excess: 1100, excessValue: 8200, daysOfSales: 80, comparison: 'atRisk' },
    { sku: 's00178', productGroup: 'Product G', excess: 400, excessValue: 3500, daysOfSales: 42, comparison: 'onTarget' },
    { sku: 's00189', productGroup: 'Product G', excess: 850, excessValue: 6800, daysOfSales: 68, comparison: 'atRisk' },
    { sku: 's00199', productGroup: 'Product G', excess: -180, excessValue: 0, daysOfSales: 8, comparison: 'onTarget' },
    { sku: 's00212', productGroup: 'Product G', excess: 1300, excessValue: 9500, daysOfSales: 90, comparison: 'atRisk' },
    { sku: 's00245', productGroup: 'Product G', excess: 600, excessValue: 4800, daysOfSales: 55, comparison: 'onTarget' },
    { sku: 's00268', productGroup: 'Product G', excess: -90, excessValue: 0, daysOfSales: 14, comparison: 'onTarget' },
    { sku: 's00289', productGroup: 'Product G', excess: 750, excessValue: 5900, daysOfSales: 62, comparison: 'atRisk' },
    { sku: 's00301', productGroup: 'Product G', excess: 200, excessValue: 1800, daysOfSales: 28, comparison: 'onTarget' },
    { sku: 's00323', productGroup: 'Product G', excess: 1050, excessValue: 8000, daysOfSales: 78, comparison: 'atRisk' },
    { sku: 's00345', productGroup: 'Product G', excess: -120, excessValue: 0, daysOfSales: 11, comparison: 'onTarget' },
    { sku: 's00367', productGroup: 'Product G', excess: 900, excessValue: 7200, daysOfSales: 70, comparison: 'atRisk' },
    { sku: 's00389', productGroup: 'Product G', excess: 350, excessValue: 3000, daysOfSales: 38, comparison: 'onTarget' },
    { sku: 's00401', productGroup: 'Product G', excess: 1150, excessValue: 8800, daysOfSales: 82, comparison: 'atRisk' },
    { sku: 's00423', productGroup: 'Product G', excess: -160, excessValue: 0, daysOfSales: 9, comparison: 'onTarget' },
    { sku: 's00445', productGroup: 'Product G', excess: 800, excessValue: 6500, daysOfSales: 67, comparison: 'atRisk' },
    { sku: 's00467', productGroup: 'Product G', excess: 500, excessValue: 4200, daysOfSales: 48, comparison: 'onTarget' },
    { sku: 's00489', productGroup: 'Product G', excess: 1200, excessValue: 9200, daysOfSales: 88, comparison: 'atRisk' },
  ];

  const totalExcessInventory = productGroups.reduce((sum, pg) => sum + pg.excessInventory, 0);
  const totalExcessValue = productGroups.reduce((sum, pg) => sum + pg.excessValue, 0);

  const excessData: ExcessData = {
    productGroups,
    skuDetails,
    summary: {
      totalExcessInventory,
      totalExcessValue,
      criticalSKUs: skuDetails.filter(s => s.daysOfSales > 60).length,
      avgDaysOfSales: Math.round(skuDetails.reduce((sum, s) => sum + s.daysOfSales, 0) / skuDetails.length),
    },
  };

  return json(excessData);
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

export default function CurrentIssuesExcessDashboard() {
  const data = useLoaderData<ExcessData>();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedProductGroup, setSelectedProductGroup] = useState('all');

  const handleTabChange = useCallback((selectedTabIndex: number) => setSelectedTab(selectedTabIndex), []);
  const handleProductGroupChange = useCallback((value: string) => setSelectedProductGroup(value), []);

  // Prepare excess inventory chart data
  const excessInventoryData = data.productGroups.map(pg => ({
    productGroup: pg.productGroup,
    'Excess inventory #': pg.excessInventory,
  }));

  const excessValueData = data.productGroups.map(pg => ({
    productGroup: pg.productGroup,
    'Excess value': pg.excessValue,
  }));

  // Prepare inventory split data
  const excessSplitData = data.skuDetails.map(sku => ({
    sku: sku.sku,
    value: sku.excess,
    color: sku.excess > 0 ? POLARIS_COLORS.excess : POLARIS_COLORS.onTarget,
  })).sort((a, b) => b.value - a.value);

  const excessValueSplitData = data.skuDetails
    .filter(sku => sku.excessValue > 0)
    .map(sku => ({
      sku: sku.sku,
      value: sku.excessValue,
    }))
    .sort((a, b) => b.value - a.value);

  const daysOfSalesData = data.skuDetails.map(sku => ({
    sku: sku.sku,
    value: sku.daysOfSales,
    color: sku.comparison === 'atRisk' ? POLARIS_COLORS.atRisk : POLARIS_COLORS.onTarget,
  })).sort((a, b) => b.value - a.value);

  const tabs = [
    { id: 'overview', content: 'Overview', accessibilityLabel: 'Overview' },
    { id: 'inventory-split', content: 'Inventory Split', accessibilityLabel: 'Split' },
    { id: 'details', content: 'Detailed Analysis', accessibilityLabel: 'Details' },
  ];

  return (
    <Page
      title="3 Current issues: Excess"
      subtitle="Excess inventory analysis by product group and SKU"
      primaryAction={{
        content: 'Export Report',
        icon: ExportIcon,
        onAction: () => console.log('Export report'),
      }}
      secondaryActions={[
        {
          content: 'Create Reduction Plan',
          onAction: () => console.log('Create plan'),
        },
        {
          content: 'Review Pricing',
          onAction: () => console.log('Review pricing'),
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
                    Total Excess Inventory
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.totalExcessInventory.toLocaleString()}
                  </Text>
                  <Badge tone="critical">High excess</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Excess Value
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    ${(data.summary.totalExcessValue / 1000).toFixed(0)}K
                  </Text>
                  <Badge tone="critical">Capital tied up</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Critical SKUs
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.criticalSKUs}
                  </Text>
                  <Badge tone="warning">{'>60 days of sales'}</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Avg Days of Sales
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.avgDaysOfSales}
                  </Text>
                  <Badge tone="info">Target: 30 days</Badge>
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
                    ...data.productGroups.map(pg => ({
                      label: pg.productGroup,
                      value: pg.productGroup,
                    })),
                  ]}
                  value={selectedProductGroup}
                  onChange={handleProductGroupChange}
                />
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
                    {/* Excess Inventory by Product Group */}
                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="400">
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Excess inventory by product group
                          </Text>
                          
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                              data={excessInventoryData}
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
                              <Bar dataKey="Excess inventory #" fill="#FF6B6B" name="Excess inventory #" />
                            </BarChart>
                          </ResponsiveContainer>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    {/* Excess Value by Product Group */}
                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="400">
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Excess value by product group
                          </Text>
                          
                          <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                              data={excessValueData}
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
                              <Bar dataKey="Excess value" fill="#1A1A1A" name="Excess value" />
                            </BarChart>
                          </ResponsiveContainer>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 1 && (
                  <Layout>
                    {/* Inventory Split - 3 Charts */}
                    <Layout.Section>
                      <Text as="h2" variant="headingLg" fontWeight="semibold">
                        Inventory split
                      </Text>
                    </Layout.Section>

                    {/* Excess # */}
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <InlineStack align="space-between">
                            <Text as="h3" variant="headingMd" fontWeight="semibold">
                              Excess #
                            </Text>
                            <Badge tone="info">{`${data.skuDetails.length} SKUs`}</Badge>
                          </InlineStack>
                          
                          <ResponsiveContainer width="100%" height={500}>
                            <BarChart
                              data={excessSplitData}
                              layout="vertical"
                              margin={{ left: 50 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 10, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                              />
                              <YAxis
                                type="category"
                                dataKey="sku"
                                tick={{ fontSize: 9, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                                width={50}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" name="Excess">
                                {excessSplitData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    {/* Excess Value */}
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <Text as="h3" variant="headingMd" fontWeight="semibold">
                            Excess value
                          </Text>
                          
                          <ResponsiveContainer width="100%" height={500}>
                            <BarChart
                              data={excessValueSplitData}
                              layout="vertical"
                              margin={{ left: 50 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 10, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                              />
                              <YAxis
                                type="category"
                                dataKey="sku"
                                tick={{ fontSize: 9, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                                width={50}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" fill={POLARIS_COLORS.excess} name="Excess Value" />
                            </BarChart>
                          </ResponsiveContainer>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    {/* Days of Sales */}
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <Text as="h3" variant="headingMd" fontWeight="semibold">
                            Days of sales
                          </Text>
                          
                          <ResponsiveContainer width="100%" height={500}>
                            <BarChart
                              data={daysOfSalesData}
                              layout="vertical"
                              margin={{ left: 50 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                              <XAxis
                                type="number"
                                tick={{ fontSize: 10, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                              />
                              <YAxis
                                type="category"
                                dataKey="sku"
                                tick={{ fontSize: 9, fill: POLARIS_COLORS.subdued }}
                                stroke={POLARIS_COLORS.border}
                                width={50}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" name="Days of Sales">
                                {daysOfSalesData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
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
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Detailed Excess Analysis
                          </Text>
                          
                          <BlockStack gap="300">
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              Top Excess Issues:
                            </Text>
                            
                            {data.skuDetails
                              .sort((a, b) => b.excess - a.excess)
                              .slice(0, 10)
                              .map((sku, index) => (
                                <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                                  <InlineStack align="space-between">
                                    <InlineStack gap="400">
                                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                                        {sku.sku}
                                      </Text>
                                      <Text as="span" variant="bodySm" tone="subdued">
                                        {sku.productGroup}
                                      </Text>
                                    </InlineStack>
                                    <InlineStack gap="400">
                                      <Badge tone={sku.daysOfSales > 60 ? 'critical' : 'warning'}>
                                        {`${sku.daysOfSales} days`}
                                      </Badge>
                                      <Text as="span" variant="bodySm" fontWeight="semibold">
                                        {`Excess: ${sku.excess.toLocaleString()} ($${(sku.excessValue / 1000).toFixed(1)}K)`}
                                      </Text>
                                    </InlineStack>
                                  </InlineStack>
                                </Box>
                              ))}
                          </BlockStack>

                          <Divider />

                          <BlockStack gap="200">
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              Recommendations:
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              • Implement promotional campaigns for high excess SKUs
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              • Review pricing strategy for Product G and Product H
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              • Consider inventory redeployment to high-demand regions
                            </Text>
                            <Text as="p" variant="bodySm" tone="subdued">
                              • Reduce future production for SKUs with {'>'}60 days of sales
                            </Text>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                Quick Actions
              </Text>
              <BlockStack gap="200">
                <Button fullWidth>Create Excess Reduction Plan</Button>
                <Button fullWidth variant="plain">Launch Promotional Campaign</Button>
                <Button fullWidth variant="plain">Review Pricing Strategy</Button>
                <Button fullWidth variant="plain">Export Detailed Report</Button>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

// Import Divider if not already imported
const Divider = () => <Box borderBlockStartWidth="025" borderColor="border" />;
