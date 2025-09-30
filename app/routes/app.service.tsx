import { useState, useCallback } from 'react';
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
  Icon
} from '@shopify/polaris';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ExportIcon
} from '@shopify/polaris-icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area
} from 'recharts';

// Polaris-aligned color palette
const POLARIS_COLORS = {
  primary: '#008060',      // Polaris green
  secondary: '#5C6AC4',    // Polaris purple
  tertiary: '#006FBB',     // Polaris blue
  critical: '#D82C0D',     // Polaris red
  warning: '#FFC453',      // Polaris yellow
  success: '#008060',      // Polaris green
  subdued: '#6D7175',      // Polaris subdued
  surface: '#F6F6F7',      // Polaris surface
  border: '#C9CCCF',       // Polaris border
};

// Sample data based on your image
const backorderData = [
  { period: 'Q3 18', dc1: 0.4, dc2: 0.3, dc3: 0.2, total: 0.9 },
  { period: 'Q4 18', dc1: 0.45, dc2: 0.32, dc3: 0.18, total: 0.95 },
  { period: 'Q1 19', dc1: 0.5, dc2: 0.35, dc3: 0.15, total: 1.0 },
  { period: 'Q2 19', dc1: 0.48, dc2: 0.36, dc3: 0.16, total: 1.0 },
  { period: 'Q3 19', dc1: 0.52, dc2: 0.38, dc3: 0.15, total: 1.05 },
  { period: 'Q4 19', dc1: 0.55, dc2: 0.4, dc3: 0.18, total: 1.13 },
  { period: 'Q1 20', dc1: 0.6, dc2: 0.42, dc3: 0.2, total: 1.22 },
  { period: 'Q2 20', dc1: 0.58, dc2: 0.43, dc3: 0.22, total: 1.23 }
];

const otifData = [
  { month: 'Oct 3', commit: 92, ship: 90, target: 95 },
  { month: 'Oct 13', commit: 91, ship: 89, target: 95 },
  { month: 'Oct 23', commit: 88, ship: 86, target: 95 },
  { month: 'Nov 2', commit: 87, ship: 85, target: 95 },
  { month: 'Nov 12', commit: 85, ship: 83, target: 95 },
  { month: 'Nov 22', commit: 82, ship: 80, target: 95 },
  { month: 'Dec 2', commit: 78, ship: 76, target: 95 },
  { month: 'Dec 12', commit: 77, ship: 76, target: 95 },
  { month: 'Dec 22', commit: 76, ship: 76, target: 95 },
  { month: 'Jan 1', commit: 76, ship: 76, target: 95 }
];

const inventoryData = [
  { week: '40W', dc1: 40, dc2: 20, dc3: 10, total: 70 },
  { week: '41W', dc1: 42, dc2: 18, dc3: 12, total: 72 },
  { week: '42W', dc1: 38, dc2: 22, dc3: 11, total: 71 },
  { week: '43W', dc1: 44, dc2: 24, dc3: 10, total: 78 },
  { week: '44W', dc1: 46, dc2: 26, dc3: 14, total: 86 },
  { week: '45W', dc1: 50, dc2: 28, dc3: 16, total: 94 },
  { week: '46W', dc1: 52, dc2: 30, dc3: 18, total: 100 },
  { week: '47W', dc1: 54, dc2: 32, dc3: 16, total: 102 },
  { week: '48W', dc1: 56, dc2: 34, dc3: 15, total: 105 }
];

export default function SupplyChainDashboard() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('quarter');
  const [selectedDC, setSelectedDC] = useState('all');
  const [selectedView, setSelectedView] = useState('performance');

  const handleTimeRangeChange = useCallback((value: string) => setSelectedTimeRange(value), []);
  const handleDCChange = useCallback((value: string) => setSelectedDC(value), []);

  const performanceMetrics = [
    { label: 'Total Backorders', value: '+66K', change: '+56K', trend: 'up', status: 'critical' },
    { label: 'OTIF (commit)', value: '76%', change: '-1.0%', trend: 'down', status: 'warning' },
    { label: 'OTIF (ship)', value: '76%', change: '-2.0%', trend: 'down', status: 'warning' },
    { label: 'Inventory Value', value: '$1.5M', change: '+0.4M', trend: 'up', status: 'success' },
    { label: 'DC 3 Performance', value: '0.7M', change: '+0.7M', trend: 'up', status: 'info' },
    { label: 'DC 2 Performance', value: '-4.2M', change: '-4.2M', trend: 'down', status: 'critical' },
    { label: 'DC 1 Performance', value: '+5.5M', change: '+5.5M', trend: 'up', status: 'success' }
  ];

  const timeRangeOptions = [
    { label: 'Quarter', value: 'quarter' },
    { label: 'Month', value: 'month' },
    { label: 'Week', value: 'week' },
  ];

  const dcOptions = [
    { label: 'All DCs', value: 'all' },
    { label: 'DC 1', value: 'dc1' },
    { label: 'DC 2', value: 'dc2' },
    { label: 'DC 3', value: 'dc3' },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean, payload?: any, label?: any }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '12px', 
          border: `1px solid ${POLARIS_COLORS.border}`, 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>{label}</p>
          {payload.map((entry: any, index: any) => (
            <p key={index} style={{ fontSize: '12px', color: entry.color, marginBottom: '4px' }}>
              {entry.name}: {typeof entry.value === 'number' ? 
                (entry.value < 10 ? `${entry.value.toFixed(2)}M` : `${entry.value}%`) : 
                entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const tableRows = [
    ['Q3 2018', '0.90', '92', '90', '70'],
    ['Q4 2018', '0.95', '91', '89', '72'],
    ['Q1 2019', '1.00', '88', '86', '71'],
    ['Q2 2019', '1.00', '87', '85', '86'],
    ['Q3 2019', '1.05', '85', '83', '94'],
    ['Q4 2019', '1.13', '82', '80', '105'],
  ];

  return (
    <Page
      title="Service & Inventory Performance Review"
      subtitle="31.12.2018 - Performance Analysis Dashboard"
      primaryAction={{
        content: 'Export Report',
        icon: ExportIcon,
        onAction: () => console.log('Export report')
      }}
    >
      <Layout>

        {/* KPI Cards */}
        <Layout.Section>
          <InlineStack gap="400" wrap={true}>
            {performanceMetrics.map((metric, index) => (
              <Box key={index} minWidth="160px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {metric.label}
                    </Text>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="h3" variant="headingLg" fontWeight="bold">
                        {metric.value}
                      </Text>
                      <Icon
                        source={metric.trend === 'up' ? ArrowUpIcon : ArrowDownIcon}
                        tone={metric.trend === 'up' ? 'success' : 'critical'}
                      />
                    </InlineStack>
                    <Badge tone={metric.status as any}>{metric.change}</Badge>
                  </BlockStack>
                </Card>
              </Box>
            ))}
          </InlineStack>
        </Layout.Section>

        {/* Filters */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" wrap={true}>
                <Box minWidth="200px">
                  <Select
                    label="Time Range"
                    options={timeRangeOptions}
                    value={selectedTimeRange}
                    onChange={handleTimeRangeChange}
                  />
                </Box>
                <Box minWidth="200px">
                  <Select
                    label="Distribution Center"
                    options={dcOptions}
                    value={selectedDC}
                    onChange={handleDCChange}
                  />
                </Box>
                <Box>
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    View Mode
                  </Text>
                  <Box paddingBlockStart="200">
                    <ButtonGroup variant="segmented">
                      <Button
                        pressed={selectedView === 'performance'}
                        onClick={() => setSelectedView('performance')}
                      >
                        Performance
                      </Button>
                      <Button
                        pressed={selectedView === 'trends'}
                        onClick={() => setSelectedView('trends')}
                      >
                        Trends
                      </Button>
                    </ButtonGroup>
                  </Box>
                </Box>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Charts Grid */}
        <Layout.Section>
          <InlineStack gap="400" wrap={false} blockAlign="stretch">
            <Box width="100%">
              <BlockStack gap="400">
                {/* Backorder Performance */}
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      End Customer Backorder Performance
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Unfulfilled customer backorder value per period ($M)
                    </Text>
                    <Box paddingBlockStart="400">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={backorderData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                          <XAxis 
                            dataKey="period" 
                            tick={{ fontSize: 12, fill: POLARIS_COLORS.subdued }} 
                            stroke={POLARIS_COLORS.border}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: POLARIS_COLORS.subdued }} 
                            stroke={POLARIS_COLORS.border}
                          />
                          <Tooltip content={CustomTooltip} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="dc1" stackId="a" fill={POLARIS_COLORS.primary} name="DC 1" />
                          <Bar dataKey="dc2" stackId="a" fill={POLARIS_COLORS.secondary} name="DC 2" />
                          <Bar dataKey="dc3" stackId="a" fill={POLARIS_COLORS.tertiary} name="DC 3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </BlockStack>
                </Card>

                {/* OTIF Performance */}
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      OTIF Performance
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      OTIF (Commit) and OTIF (Ship), end customer order lines committed/shipped, % of total order lines
                    </Text>
                    <Box paddingBlockStart="400">
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={otifData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                          <XAxis 
                            dataKey="month" 
                            tick={{ fontSize: 12, fill: POLARIS_COLORS.subdued }} 
                            stroke={POLARIS_COLORS.border}
                          />
                          <YAxis 
                            domain={[70, 100]} 
                            tick={{ fontSize: 12, fill: POLARIS_COLORS.subdued }} 
                            stroke={POLARIS_COLORS.border}
                          />
                          <Tooltip content={CustomTooltip} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Area 
                            type="monotone" 
                            dataKey="target" 
                            fill="#E3F1DF" 
                            stroke={POLARIS_COLORS.success} 
                            name="Target" 
                            opacity={0.3} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="commit" 
                            stroke={POLARIS_COLORS.tertiary} 
                            strokeWidth={2} 
                            name="OTIF (Commit)" 
                            dot={{ r: 3, fill: POLARIS_COLORS.tertiary }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ship" 
                            stroke={POLARIS_COLORS.secondary} 
                            strokeWidth={2} 
                            name="OTIF (Ship)" 
                            dot={{ r: 3, fill: POLARIS_COLORS.secondary }} 
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </Box>
                  </BlockStack>
                </Card>

                {/* Inventory Performance */}
                <Card>
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Inventory Performance
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Inventory values per week ($M)
                    </Text>
                    <Box paddingBlockStart="400">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={inventoryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                          <XAxis 
                            dataKey="week" 
                            tick={{ fontSize: 12, fill: POLARIS_COLORS.subdued }} 
                            stroke={POLARIS_COLORS.border}
                          />
                          <YAxis 
                            tick={{ fontSize: 12, fill: POLARIS_COLORS.subdued }} 
                            stroke={POLARIS_COLORS.border}
                          />
                          <Tooltip content={CustomTooltip} />
                          <Legend wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="dc1" stackId="a" fill={POLARIS_COLORS.primary} name="DC 1" />
                          <Bar dataKey="dc2" stackId="a" fill={POLARIS_COLORS.secondary} name="DC 2" />
                          <Bar dataKey="dc3" stackId="a" fill={POLARIS_COLORS.tertiary} name="DC 3" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </BlockStack>
                </Card>

                {/* Data Table */}
                <Card>
                  <BlockStack gap="400">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Performance Summary
                    </Text>
                    <DataTable
                      columnContentTypes={[
                        'text',
                        'numeric',
                        'numeric',
                        'numeric',
                        'numeric',
                      ]}
                      headings={[
                        'Period',
                        'Backorders ($M)',
                        'OTIF Commit (%)',
                        'OTIF Ship (%)',
                        'Inventory ($M)',
                      ]}
                      rows={tableRows}
                      hoverable
                    />
                  </BlockStack>
                </Card>
              </BlockStack>
            </Box>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}