// app/routes/sku-prioritization.tsx
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
  ButtonGroup,
  Button,
  BlockStack,
  InlineStack,
  Box,
  DataTable,
  Icon,
  Filters,
  ChoiceList,
  TextField,
  RangeSlider,
  Divider,
  IndexTable,
  useIndexResourceState,
  EmptySearchResult,
  IndexFilters,
  useSetIndexFiltersMode,
  Tabs,
} from '@shopify/polaris';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ExportIcon,
  FilterIcon,
  SearchIcon,
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
  LineChart,
  Line,
  ComposedChart,
  Area,
} from 'recharts';

// Types
interface ProductGroup {
  id: string;
  name: string;
  otifCommit: number;
  otifShip: number;
  shortage: number;
  endCustomerBackorders: number;
  trend: 'up' | 'down' | 'stable';
  priority: 'high' | 'medium' | 'low';
}

interface SKUData {
  sku: string;
  productGroup: string;
  shortageWeeks: number[];
  otifCommit: number;
  otifShip: number;
  endBackorders: number;
  priority: number;
  status: 'critical' | 'warning' | 'normal';
}

interface DashboardData {
  productGroups: ProductGroup[];
  skuDetails: SKUData[];
  summaryMetrics: {
    totalShortage: number;
    avgOTIF: number;
    totalBackorders: number;
    criticalSKUs: number;
  };
}

// Loader function for Remix
export const loader: LoaderFunction = async () => {
  // In production, this would fetch from your FastAPI backend
  const dashboardData: DashboardData = {
    productGroups: [
      {
        id: '1',
        name: 'Product01',
        otifCommit: 85,
        otifShip: 82,
        shortage: 1200,
        endCustomerBackorders: 450,
        trend: 'down',
        priority: 'high'
      },
      {
        id: '2',
        name: 'Product02',
        otifCommit: 78,
        otifShip: 75,
        shortage: 950,
        endCustomerBackorders: 380,
        trend: 'down',
        priority: 'high'
      },
      {
        id: '3',
        name: 'Product03',
        otifCommit: 92,
        otifShip: 90,
        shortage: 200,
        endCustomerBackorders: 120,
        trend: 'up',
        priority: 'low'
      },
      {
        id: '4',
        name: 'Product04',
        otifCommit: 70,
        otifShip: 68,
        shortage: 1500,
        endCustomerBackorders: 680,
        trend: 'down',
        priority: 'high'
      },
      {
        id: '5',
        name: 'Product05',
        otifCommit: 88,
        otifShip: 86,
        shortage: 400,
        endCustomerBackorders: 220,
        trend: 'stable',
        priority: 'medium'
      },
      {
        id: '6',
        name: 'Product06',
        otifCommit: 76,
        otifShip: 73,
        shortage: 850,
        endCustomerBackorders: 420,
        trend: 'down',
        priority: 'high'
      },
      {
        id: '7',
        name: 'Product07',
        otifCommit: 91,
        otifShip: 89,
        shortage: 180,
        endCustomerBackorders: 95,
        trend: 'up',
        priority: 'low'
      },
      {
        id: '8',
        name: 'Product08',
        otifCommit: 83,
        otifShip: 80,
        shortage: 620,
        endCustomerBackorders: 310,
        trend: 'stable',
        priority: 'medium'
      },
      {
        id: '9',
        name: 'Product09',
        otifCommit: 79,
        otifShip: 77,
        shortage: 780,
        endCustomerBackorders: 390,
        trend: 'down',
        priority: 'high'
      },
      {
        id: '10',
        name: 'Product10',
        otifCommit: 87,
        otifShip: 85,
        shortage: 350,
        endCustomerBackorders: 180,
        trend: 'up',
        priority: 'medium'
      },
    ],
    skuDetails: [
      {
        sku: '100154_Product01',
        productGroup: 'Product01',
        shortageWeeks: [800, 1000, 1200, 1400, 1600, 1800, 2000, 1800],
        otifCommit: 85,
        otifShip: 82,
        endBackorders: 450,
        priority: 1,
        status: 'critical'
      },
      {
        sku: '100155_Product01',
        productGroup: 'Product01',
        shortageWeeks: [600, 700, 800, 900, 950, 1000, 1100, 1050],
        otifCommit: 83,
        otifShip: 80,
        endBackorders: 380,
        priority: 2,
        status: 'critical'
      },
      {
        sku: '100156_Product02',
        productGroup: 'Product02',
        shortageWeeks: [400, 500, 600, 700, 800, 850, 900, 880],
        otifCommit: 78,
        otifShip: 75,
        endBackorders: 320,
        priority: 3,
        status: 'warning'
      },
      // Add more SKUs as needed
    ],
    summaryMetrics: {
      totalShortage: 8030,
      avgOTIF: 82.4,
      totalBackorders: 3245,
      criticalSKUs: 15
    }
  };

  return json(dashboardData);
};

// Color palette aligned with Polaris
const COLORS = {
  primary: '#008060',
  secondary: '#5C6AC4',
  tertiary: '#006FBB',
  critical: '#D82C0D',
  warning: '#FFC453',
  success: '#008060',
  subdued: '#6D7175',
  surface: '#F6F6F7',
  border: '#C9CCCF',
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        border: `1px solid ${COLORS.border}`,
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ fontSize: '12px', color: entry.color, marginBottom: '4px' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function SKUPrioritizationDashboard() {
  const data = useLoaderData<DashboardData>();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState('8weeks');
  const [selectedProductGroup, setSelectedProductGroup] = useState('all');
  const [queryValue, setQueryValue] = useState('');
  const { mode, setMode } = useSetIndexFiltersMode();
  
  const resourceName = {
    singular: 'SKU',
    plural: 'SKUs',
  };

  const {
    selectedResources,
    allResourcesSelected,
    handleSelectionChange,
  } = useIndexResourceState(data.skuDetails);

  const handleTabChange = useCallback(
    (selectedTabIndex: number) => setSelectedTab(selectedTabIndex),
    [],
  );

  const handleTimeRangeChange = useCallback(
    (value: string) => setSelectedTimeRange(value),
    [],
  );

  const handleProductGroupChange = useCallback(
    (value: string) => setSelectedProductGroup(value),
    [],
  );

  const handleQueryValueChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );

  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);

  // Prepare data for product group chart
  const productGroupChartData = data.productGroups.map(pg => ({
    name: pg.name,
    'OTIF Commit': pg.otifCommit,
    'OTIF Ship': pg.otifShip,
    'Shortage': pg.shortage / 10, // Scale for better visualization
    'Backorders': pg.endCustomerBackorders / 10,
  }));

  // Prepare data for SKU timeline chart
  const skuTimelineData = [
    { week: 'W40', shortage: 1800, otif: 85, backorders: 450 },
    { week: 'W41', shortage: 2000, otif: 83, backorders: 480 },
    { week: 'W42', shortage: 2200, otif: 82, backorders: 520 },
    { week: 'W43', shortage: 2400, otif: 80, backorders: 550 },
    { week: 'W44', shortage: 2600, otif: 78, backorders: 580 },
    { week: 'W45', shortage: 2800, otif: 76, backorders: 610 },
    { week: 'W46', shortage: 3000, otif: 75, backorders: 640 },
    { week: 'W47', shortage: 3200, otif: 73, backorders: 680 },
    { week: 'W48', shortage: 3400, otif: 71, backorders: 720 },
  ];

  const tabs = [
    {
      id: 'overview',
      content: 'Overview',
      accessibilityLabel: 'Overview',
      panelID: 'overview-panel',
    },
    {
      id: 'by-product',
      content: 'By Product Group',
      accessibilityLabel: 'By Product Group',
      panelID: 'product-panel',
    },
    {
      id: 'by-sku',
      content: 'By SKU',
      accessibilityLabel: 'By SKU',
      panelID: 'sku-panel',
    },
  ];

  const filters = [
    {
      key: 'productGroup',
      label: 'Product Group',
      filter: (
        <ChoiceList
          title="Product Group"
          titleHidden
          choices={[
            { label: 'All', value: 'all' },
            ...data.productGroups.map(pg => ({
              label: pg.name,
              value: pg.id
            }))
          ]}
          selected={selectedProductGroup ? [selectedProductGroup] : []}
          onChange={(value) => setSelectedProductGroup(value[0])}
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = selectedProductGroup !== 'all' ? [
    {
      key: 'productGroup',
      label: disambiguateLabel('productGroup', selectedProductGroup),
      onRemove: () => setSelectedProductGroup('all'),
    },
  ] : [];

  function disambiguateLabel(key: string, value: string) {
    const group = data.productGroups.find(pg => pg.id === value);
    return group ? group.name : value;
  }

  const rowMarkup = data.skuDetails.map((sku, index) => (
    <IndexTable.Row
      id={sku.sku}
      key={sku.sku}
      selected={selectedResources.includes(sku.sku)}
      position={index}
    >
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="dd">
          {sku.sku}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{sku.productGroup}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" numeric>
          {sku.shortageWeeks[sku.shortageWeeks.length - 1]}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={sku.otifCommit < 80 ? 'critical' : sku.otifCommit < 90 ? 'warning' : 'success'}>
          {`${sku.otifCommit}%`}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={sku.otifShip < 80 ? 'critical' : sku.otifShip < 90 ? 'warning' : 'success'}>
          {`${sku.otifShip}%`}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" numeric>
          {sku.endBackorders}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={sku.status === 'critical' ? 'critical' : sku.status === 'warning' ? 'warning' : 'info'}>
          {sku.status}
        </Badge>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page
      title="SKU Prioritization Overview"
      subtitle="31.12.2018 - Service metrics by product group"
      primaryAction={{
        content: 'Export Report',
        icon: ExportIcon,
        onAction: () => console.log('Export report'),
      }}
      secondaryActions={[
        {
          content: 'Refresh Data',
          onAction: () => console.log('Refresh data'),
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
                    Total Shortage (8 weeks)
                  </Text>
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingLg" fontWeight="bold">
                      {data.summaryMetrics.totalShortage.toLocaleString()}
                    </Text>
                    <Icon source={ArrowUpIcon} tone="critical" />
                  </InlineStack>
                  <Badge tone="critical">+15% vs last period</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Average OTIF
                  </Text>
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingLg" fontWeight="bold">
                      {data.summaryMetrics.avgOTIF}%
                    </Text>
                    <Icon source={ArrowDownIcon} tone="critical" />
                  </InlineStack>
                  <Badge tone="warning">-2.3% vs target</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    End Customer Backorders
                  </Text>
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingLg" fontWeight="bold">
                      {data.summaryMetrics.totalBackorders.toLocaleString()}
                    </Text>
                    <Icon source={ArrowUpIcon} tone="critical" />
                  </InlineStack>
                  <Badge tone="critical">+8% vs last week</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Critical SKUs
                  </Text>
                  <InlineStack align="space-between">
                    <Text as="h3" variant="headingLg" fontWeight="bold">
                      {data.summaryMetrics.criticalSKUs}
                    </Text>
                    <Icon source={ArrowUpIcon} tone="critical" />
                  </InlineStack>
                  <Badge tone="critical">Need immediate attention</Badge>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Tabs for different views */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              <Box padding="400">
                {selectedTab === 0 && (
                  <BlockStack gap="400">
                    {/* Filters */}
                    <InlineStack gap="400">
                      <Box minWidth="150px">
                        <Select
                          label="Time Range"
                          options={[
                            { label: '8 Weeks', value: '8weeks' },
                            { label: '12 Weeks', value: '12weeks' },
                            { label: '16 Weeks', value: '16weeks' },
                          ]}
                          value={selectedTimeRange}
                          onChange={handleTimeRangeChange}
                        />
                      </Box>
                      <Box minWidth="200px">
                        <Select
                          label="Product Group"
                          options={[
                            { label: 'All Groups', value: 'all' },
                            ...data.productGroups.map(pg => ({
                              label: pg.name,
                              value: pg.id
                            }))
                          ]}
                          value={selectedProductGroup}
                          onChange={handleProductGroupChange}
                        />
                      </Box>
                    </InlineStack>

                    {/* Overview Chart */}
                    <Card>
                      <BlockStack gap="200">
                        <Text as="h2" variant="headingMd" fontWeight="semibold">
                          Service Metrics by Product Group
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          OTIF at commit, order lines missed, and end-customer backorders
                        </Text>
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={productGroupChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 11, fill: COLORS.subdued }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis tick={{ fontSize: 11, fill: COLORS.subdued }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar dataKey="OTIF Commit" fill={COLORS.primary} />
                            <Bar dataKey="OTIF Ship" fill={COLORS.secondary} />
                            <Bar dataKey="Shortage" fill={COLORS.warning} />
                            <Bar dataKey="Backorders" fill={COLORS.critical} />
                          </BarChart>
                        </ResponsiveContainer>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {selectedTab === 1 && (
                  <BlockStack gap="400">
                    {/* Product Group Detailed View */}
                    <Card>
                      <BlockStack gap="200">
                        <Text as="h2" variant="headingMd" fontWeight="semibold">
                          Product Group Performance Details
                        </Text>
                        <ResponsiveContainer width="100%" height={500}>
                          <ComposedChart data={skuTimelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                            <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Bar yAxisId="left" dataKey="shortage" fill={COLORS.warning} name="Shortage" />
                            <Bar yAxisId="left" dataKey="backorders" fill={COLORS.critical} name="Backorders" />
                            <Line yAxisId="right" type="monotone" dataKey="otif" stroke={COLORS.primary} strokeWidth={2} name="OTIF %" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {selectedTab === 2 && (
                  <BlockStack gap="400">
                    {/* SKU Level Table */}
                    <Card>
                      <IndexFilters
                        queryValue={queryValue}
                        queryPlaceholder="Search SKUs..."
                        onQueryChange={handleQueryValueChange}
                        onQueryClear={handleQueryValueRemove}
                        cancelAction={{
                          onAction: () => {},
                          disabled: false,
                          loading: false,
                        }}
                        tabs={[]}
                        selected={0}
                        onSelect={() => {}}
                        filters={filters}
                        appliedFilters={appliedFilters}
                        onClearAll={() => setSelectedProductGroup('all')}
                        mode={mode}
                        setMode={setMode}
                      />
                      <IndexTable
                        resourceName={resourceName}
                        itemCount={data.skuDetails.length}
                        selectedItemsCount={
                          allResourcesSelected ? 'All' : selectedResources.length
                        }
                        onSelectionChange={handleSelectionChange}
                        headings={[
                          { title: 'SKU' },
                          { title: 'Product Group' },
                          { title: 'Current Shortage' },
                          { title: 'OTIF Commit' },
                          { title: 'OTIF Ship' },
                          { title: 'Backorders' },
                          { title: 'Status' },
                        ]}
                      >
                        {rowMarkup}
                      </IndexTable>
                    </Card>
                  </BlockStack>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}