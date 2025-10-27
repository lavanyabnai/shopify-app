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
  Icon,
} from '@shopify/polaris';
import {
  ExportIcon,
  GlobeIcon,
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
interface CountryData {
  sku: string;
  country: string;
  countryCode: string;
  endCustomerBackorders: number;
  operationalBackorders: number;
  inventory: number;
  region: string;
}

interface RedeployData {
  skuId: string;
  totalBackorders: number;
  totalStock: number;
  countries: CountryData[];
  summary: {
    criticalCountries: number;
    totalCountries: number;
    redeployOpportunities: number;
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
  endCustomer: '#1A1A1A',
  operational: '#666666',
};

// Loader
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const skuId = url.searchParams.get('sku') || 's00135';

  // Generate sample data based on the image
  const countries: CountryData[] = [
    { sku: skuId, country: 'Thailand', countryCode: 'TH', endCustomerBackorders: 285, operationalBackorders: 120, inventory: 143.3, region: 'Asia' },
    { sku: skuId, country: 'Argentina', countryCode: 'AR', endCustomerBackorders: 85, operationalBackorders: 40, inventory: 82.5, region: 'South America' },
    { sku: skuId, country: 'Australia', countryCode: 'AU', endCustomerBackorders: 75, operationalBackorders: 35, inventory: 118.0, region: 'Oceania' },
    { sku: skuId, country: 'Austria', countryCode: 'AT', endCustomerBackorders: 70, operationalBackorders: 30, inventory: 95.2, region: 'Europe' },
    { sku: skuId, country: 'Belgium', countryCode: 'BE', endCustomerBackorders: 65, operationalBackorders: 28, inventory: 87.4, region: 'Europe' },
    { sku: skuId, country: 'Brazil', countryCode: 'BR', endCustomerBackorders: 60, operationalBackorders: 25, inventory: 105.6, region: 'South America' },
    { sku: skuId, country: 'Bulgaria', countryCode: 'BG', endCustomerBackorders: 55, operationalBackorders: 22, inventory: 78.9, region: 'Europe' },
    { sku: skuId, country: 'Cambodia', countryCode: 'KH', endCustomerBackorders: 50, operationalBackorders: 20, inventory: 92.3, region: 'Asia' },
    { sku: skuId, country: 'Canada', countryCode: 'CA', endCustomerBackorders: 45, operationalBackorders: 18, inventory: 110.7, region: 'North America' },
    { sku: skuId, country: 'Chile', countryCode: 'CL', endCustomerBackorders: 40, operationalBackorders: 15, inventory: 88.5, region: 'South America' },
    { sku: skuId, country: 'China', countryCode: 'CN', endCustomerBackorders: 38, operationalBackorders: 14, inventory: 125.8, region: 'Asia' },
    { sku: skuId, country: 'Colombia', countryCode: 'CO', endCustomerBackorders: 35, operationalBackorders: 12, inventory: 76.4, region: 'South America' },
    { sku: skuId, country: 'Costa Rica', countryCode: 'CR', endCustomerBackorders: 32, operationalBackorders: 10, inventory: 65.2, region: 'Central America' },
    { sku: skuId, country: 'Croatia', countryCode: 'HR', endCustomerBackorders: 30, operationalBackorders: 9, inventory: 58.9, region: 'Europe' },
    { sku: skuId, country: 'Cyprus', countryCode: 'CY', endCustomerBackorders: 28, operationalBackorders: 8, inventory: 52.3, region: 'Europe' },
    { sku: skuId, country: 'Czech', countryCode: 'CZ', endCustomerBackorders: 25, operationalBackorders: 7, inventory: 48.7, region: 'Europe' },
    { sku: skuId, country: 'Denmark', countryCode: 'DK', endCustomerBackorders: 22, operationalBackorders: 6, inventory: 72.1, region: 'Europe' },
    { sku: skuId, country: 'Estonia', countryCode: 'EE', endCustomerBackorders: 20, operationalBackorders: 5, inventory: 45.6, region: 'Europe' },
    { sku: skuId, country: 'Finland', countryCode: 'FI', endCustomerBackorders: 18, operationalBackorders: 4, inventory: 68.9, region: 'Europe' },
    { sku: skuId, country: 'France', countryCode: 'FR', endCustomerBackorders: 15, operationalBackorders: 3, inventory: 138.2, region: 'Europe' },
    { sku: skuId, country: 'Germany', countryCode: 'DE', endCustomerBackorders: 12, operationalBackorders: 2, inventory: 132.5, region: 'Europe' },
    { sku: skuId, country: 'Hungary', countryCode: 'HU', endCustomerBackorders: 10, operationalBackorders: 2, inventory: 89.4, region: 'Europe' },
    { sku: skuId, country: 'Italy', countryCode: 'IT', endCustomerBackorders: 8, operationalBackorders: 1, inventory: 115.7, region: 'Europe' },
    { sku: skuId, country: 'Japan', countryCode: 'JP', endCustomerBackorders: 7, operationalBackorders: 1, inventory: 128.3, region: 'Asia' },
    { sku: skuId, country: 'Mexico', countryCode: 'MX', endCustomerBackorders: 6, operationalBackorders: 1, inventory: 98.6, region: 'North America' },
    { sku: skuId, country: 'Netherlands', countryCode: 'NL', endCustomerBackorders: 5, operationalBackorders: 1, inventory: 105.2, region: 'Europe' },
    { sku: skuId, country: 'Poland', countryCode: 'PL', endCustomerBackorders: 4, operationalBackorders: 0, inventory: 92.8, region: 'Europe' },
    { sku: skuId, country: 'Spain', countryCode: 'ES', endCustomerBackorders: 3, operationalBackorders: 0, inventory: 108.4, region: 'Europe' },
    { sku: skuId, country: 'United States', countryCode: 'US', endCustomerBackorders: 2, operationalBackorders: 0, inventory: 135.9, region: 'North America' },
    { sku: skuId, country: 'United Kingdom', countryCode: 'GB', endCustomerBackorders: 2, operationalBackorders: 0, inventory: 119.7, region: 'Europe' },
  ];

  const totalBackorders = countries.reduce((sum, c) => sum + c.endCustomerBackorders + c.operationalBackorders, 0);
  const totalStock = countries.reduce((sum, c) => sum + c.inventory, 0);

  const redeployData: RedeployData = {
    skuId,
    totalBackorders,
    totalStock: Math.round(totalStock),
    countries,
    summary: {
      criticalCountries: countries.filter(c => c.endCustomerBackorders > 50).length,
      totalCountries: countries.length,
      redeployOpportunities: 8,
    },
  };

  return json(redeployData);
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

// World map visualization with regional breakdown
const WorldMapVisualization = ({ data, title }: { data: CountryData[], title: string }) => {
  // Group by region
  const regionData = data.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = {
        totalInventory: 0,
        totalBackorders: 0,
        countries: [],
      };
    }
    acc[country.region].totalInventory += country.inventory;
    acc[country.region].totalBackorders += country.endCustomerBackorders + country.operationalBackorders;
    acc[country.region].countries.push(country);
    return acc;
  }, {} as Record<string, { totalInventory: number; totalBackorders: number; countries: CountryData[] }>);

  const regions = Object.entries(regionData).map(([region, stats]) => ({
    region,
    ...stats,
  })).sort((a, b) => b.totalInventory - a.totalInventory);

  const topCountries = [...data]
    .sort((a, b) => b.inventory - a.inventory)
    .slice(0, 10);

  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between">
          <Text as="h2" variant="headingMd" fontWeight="semibold">
            {title}
          </Text>
          <Badge tone="info">{`${data.length} countries`}</Badge>
        </InlineStack>
        
        <Layout>
          <Layout.Section variant="oneHalf">
            {/* Regional Distribution */}
            <Card>
              <BlockStack gap="300">
                <InlineStack align="space-between">
                  <Text as="h3" variant="headingSm" fontWeight="semibold">
                    Regional Distribution
                  </Text>
                  <Icon source={GlobeIcon} tone="subdued" />
                </InlineStack>
                
                <BlockStack gap="200">
                  {regions.map((region, index) => {
                    const inventoryPercent = (region.totalInventory / data.reduce((sum, c) => sum + c.inventory, 0)) * 100;
                    const hasHighBackorders = region.totalBackorders > 100;
                    
                    return (
                      <Box key={index} padding="300" background="bg-surface-secondary" borderRadius="200">
                        <BlockStack gap="200">
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodyMd" fontWeight="semibold">
                              {region.region}
                            </Text>
                            <Badge tone={hasHighBackorders ? 'critical' : 'success'}>
                              {`${region.countries.length} countries`}
                            </Badge>
                          </InlineStack>
                          
                          <InlineStack gap="400">
                            <InlineStack gap="100">
                              <Text as="span" variant="bodySm" tone="subdued">
                                Inventory:
                              </Text>
                              <Text as="span" variant="bodySm" fontWeight="semibold">
                                {region.totalInventory.toFixed(0)}
                              </Text>
                            </InlineStack>
                            <InlineStack gap="100">
                              <Text as="span" variant="bodySm" tone="subdued">
                                Backorders:
                              </Text>
                              <Text as="span" variant="bodySm" fontWeight="semibold" tone={hasHighBackorders ? 'critical' : undefined}>
                                {region.totalBackorders}
                              </Text>
                            </InlineStack>
                          </InlineStack>
                          
                          {/* Progress bar showing inventory percentage */}
                          <Box>
                            <div style={{ 
                              width: '100%', 
                              height: '8px', 
                              backgroundColor: POLARIS_COLORS.surface,
                              borderRadius: '4px',
                              overflow: 'hidden'
                            }}>
                              <div style={{
                                width: `${inventoryPercent}%`,
                                height: '100%',
                                backgroundColor: hasHighBackorders ? POLARIS_COLORS.warning : POLARIS_COLORS.success,
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                            <Text as="p" variant="bodySm" tone="subdued">
                              {inventoryPercent.toFixed(1)}% of global inventory
                            </Text>
                          </Box>
                        </BlockStack>
                      </Box>
                    );
                  })}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneHalf">
            {/* Top Countries */}
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm" fontWeight="semibold">
                  Top 10 Inventory Locations
                </Text>
                
                <BlockStack gap="200">
                  {topCountries.map((country, index) => {
                    const maxInventory = topCountries[0].inventory;
                    const widthPercent = (country.inventory / maxInventory) * 100;
                    const hasBackorders = (country.endCustomerBackorders + country.operationalBackorders) > 0;
                    
                    return (
                      <Box key={index}>
                        <BlockStack gap="100">
                          <InlineStack align="space-between">
                            <InlineStack gap="200">
                              <Text as="span" variant="bodySm" fontWeight="semibold">
                                {index + 1}.
                              </Text>
                              <Text as="span" variant="bodySm">
                                {country.country}
                              </Text>
                            </InlineStack>
                            <InlineStack gap="200">
                              <Text as="span" variant="bodySm" fontWeight="semibold">
                                {country.inventory.toFixed(1)}
                              </Text>
                              {hasBackorders && (
                                <Badge tone="warning" size="small">
                                  {`${country.endCustomerBackorders + country.operationalBackorders}`}
                                </Badge>
                              )}
                            </InlineStack>
                          </InlineStack>
                          
                          <div style={{ 
                            width: '100%', 
                            height: '6px', 
                            backgroundColor: POLARIS_COLORS.surface,
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${widthPercent}%`,
                              height: '100%',
                              backgroundColor: hasBackorders ? POLARIS_COLORS.warning : POLARIS_COLORS.primary,
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                        </BlockStack>
                      </Box>
                    );
                  })}
                </BlockStack>
                
                <Text as="p" variant="bodySm" tone="subdued">
                  • Green bars: Available inventory
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  • Orange bars: Has backorders
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Summary Insights */}
        <Box padding="400" background="bg-surface-secondary" borderRadius="200">
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              📍 Distribution Insights
            </Text>
            <InlineStack gap="600" wrap>
              <Text as="span" variant="bodySm" tone="subdued">
                • Europe leads with {((regionData['Europe']?.totalInventory || 0) / data.reduce((sum, c) => sum + c.inventory, 0) * 100).toFixed(1)}% of inventory
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                • Asia has highest backorder concentration
              </Text>
              <Text as="span" variant="bodySm" tone="subdued">
                • Consider inter-region transfers to optimize
              </Text>
            </InlineStack>
          </BlockStack>
        </Box>
      </BlockStack>
    </Card>
  );
};

export default function ActionRedeployStockDashboard() {
  const data = useLoaderData<RedeployData>();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState('all');

  const handleTabChange = useCallback((selectedTabIndex: number) => setSelectedTab(selectedTabIndex), []);
  const handleRegionChange = useCallback((value: string) => setSelectedRegion(value), []);

  // Prepare backorders chart data
  const backordersData = [...data.countries]
    .filter(c => c.endCustomerBackorders > 0 || c.operationalBackorders > 0)
    .sort((a, b) => (b.endCustomerBackorders + b.operationalBackorders) - (a.endCustomerBackorders + a.operationalBackorders))
    .slice(0, 20)
    .map(country => ({
      country: country.country,
      'End-customer backorders': country.endCustomerBackorders,
      'Operational backorders': country.operationalBackorders,
    }));

  // Prepare stock chart data
  const stockData = [...data.countries]
    .sort((a, b) => b.inventory - a.inventory)
    .map(country => ({
      country: country.country,
      Inventory: country.inventory,
    }));

  const tabs = [
    { id: 'backorders', content: 'Backorders View', accessibilityLabel: 'Backorders' },
    { id: 'inventory', content: 'Inventory View', accessibilityLabel: 'Inventory' },
    { id: 'analysis', content: 'Redeploy Analysis', accessibilityLabel: 'Analysis' },
  ];

  const regions = [
    { label: 'All Regions', value: 'all' },
    { label: 'Europe', value: 'Europe' },
    { label: 'Asia', value: 'Asia' },
    { label: 'North America', value: 'North America' },
    { label: 'South America', value: 'South America' },
  ];

  return (
    <Page
      title="Action: Redeploy stock"
      subtitle={`Current backorders and global inventories (${data.skuId})`}
      primaryAction={{
        content: 'Export Report',
        icon: ExportIcon,
        onAction: () => console.log('Export report'),
      }}
      secondaryActions={[
        {
          content: 'Generate Redeploy Plan',
          onAction: () => console.log('Generate plan'),
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
                    Total Backorders
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.totalBackorders.toLocaleString()}
                  </Text>
                  <Badge tone="critical">Needs attention</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Global Stock
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.totalStock.toLocaleString()}
                  </Text>
                  <Badge tone="success">Available</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Critical Countries
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.criticalCountries}
                  </Text>
                  <Badge tone="warning">High priority</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Redeploy Opportunities
                  </Text>
                  <Text as="p" variant="heading2xl" fontWeight="bold">
                    {data.summary.redeployOpportunities}
                  </Text>
                  <Badge tone="info">Identified</Badge>
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
                  label="Region"
                  options={regions}
                  value={selectedRegion}
                  onChange={handleRegionChange}
                />
              </Box>
            </InlineStack>
          </Card>
        </Layout.Section>

        {/* Tabs */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              <Box padding="400">
                {selectedTab === 0 && (
                  <Layout>
                    <Layout.Section>
                      <BlockStack gap="600">
                        {/* Current Backorders Chart */}
                        <Card>
                          <BlockStack gap="400">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">
                              Current backorders ({data.skuId})
                            </Text>
                            <ResponsiveContainer width="100%" height={400}>
                              <BarChart 
                                data={backordersData} 
                                layout="vertical"
                                margin={{ left: 80 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                                <XAxis 
                                  type="number"
                                  tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                                  stroke={POLARIS_COLORS.border}
                                />
                                <YAxis 
                                  type="category"
                                  dataKey="country"
                                  tick={{ fontSize: 10, fill: POLARIS_COLORS.subdued }}
                                  stroke={POLARIS_COLORS.border}
                                  width={80}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                                <Bar 
                                  dataKey="End-customer backorders" 
                                  stackId="a"
                                  fill={POLARIS_COLORS.endCustomer}
                                />
                                <Bar 
                                  dataKey="Operational backorders" 
                                  stackId="a"
                                  fill={POLARIS_COLORS.operational}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </BlockStack>
                        </Card>

                        {/* World Map */}
                        <WorldMapVisualization data={data.countries} title={`Global inventories (${data.skuId})`} />
                      </BlockStack>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 1 && (
                  <Layout>
                    <Layout.Section>
                      <BlockStack gap="600">
                        {/* Global Stock Chart */}
                        <Card>
                          <BlockStack gap="400">
                            <Text as="h2" variant="headingMd" fontWeight="semibold">
                              Global stock ({data.skuId})
                            </Text>
                            <ResponsiveContainer width="100%" height={500}>
                              <BarChart 
                                data={stockData} 
                                layout="vertical"
                                margin={{ left: 100 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                                <XAxis 
                                  type="number"
                                  tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                                  stroke={POLARIS_COLORS.border}
                                  label={{ value: 'Inventory #', position: 'bottom' }}
                                />
                                <YAxis 
                                  type="category"
                                  dataKey="country"
                                  tick={{ fontSize: 10, fill: POLARIS_COLORS.subdued }}
                                  stroke={POLARIS_COLORS.border}
                                  width={90}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="Inventory" fill={POLARIS_COLORS.tertiary}>
                                  {stockData.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={entry.Inventory > 120 ? POLARIS_COLORS.success : POLARIS_COLORS.tertiary}
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </BlockStack>
                        </Card>

                        {/* World Map */}
                        <WorldMapVisualization data={data.countries} title={`Global inventories (${data.skuId})`} />
                      </BlockStack>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 2 && (
                  <Layout>
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <Text as="h2" variant="headingMd" fontWeight="semibold">
                            Redeploy Analysis & Recommendations
                          </Text>
                          
                          <BlockStack gap="300">
                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              Priority Redeployment Opportunities:
                            </Text>
                            
                            <Box padding="400" background="bg-surface-secondary" borderRadius="200">
                              <BlockStack gap="200">
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm">
                                    🔴 Thailand: 285 backorders
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="semibold">
                                    → Move from France (138.2) or US (135.9)
                                  </Text>
                                </InlineStack>
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm">
                                    🟡 Argentina: 85 backorders
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="semibold">
                                    → Move from Germany (132.5)
                                  </Text>
                                </InlineStack>
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm">
                                    🟡 Australia: 75 backorders
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="semibold">
                                    → Move from Japan (128.3)
                                  </Text>
                                </InlineStack>
                              </BlockStack>
                            </Box>

                            <Text as="p" variant="bodyMd" fontWeight="semibold">
                              Key Insights:
                            </Text>
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm" tone="subdued">
                                • Total of {data.totalStock} units available globally
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                • {data.totalBackorders} units in backorder across {data.summary.criticalCountries} critical countries
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                • High inventory in Europe & US can cover Asian demand
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                • Estimated 3-5 days for cross-region redeployment
                              </Text>
                            </BlockStack>

                            <BlockStack gap="200">
                              <Button fullWidth>Generate Redeploy Orders</Button>
                              <Button fullWidth variant="plain">Calculate Shipping Costs</Button>
                              <Button fullWidth variant="plain">View Detailed Analysis</Button>
                            </BlockStack>
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
      </Layout>
    </Page>
  );
}
