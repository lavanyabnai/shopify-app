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
  DataTable,
  Icon,
  ButtonGroup,
} from '@shopify/polaris';
import {
  ExportIcon,
  ArrowUpIcon,
  ArrowDownIcon,
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
  Cell,
} from 'recharts';

// Types
interface WeekData {
  week: string;
  actual: number;
  forecast: number;
  forecast1: number;
  forecast11: number;
  forecastUpdate: number;
  forecastAccuracy: number;
  duration: number;
  bias: number;
}

interface DemandData {
  skuId: string;
  fca: number; // Forecast Accuracy
  bias: number;
  weeklyData: WeekData[];
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
  actual: '#00A0AC',
  forecast: '#303030',
};

// Loader
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const skuId = url.searchParams.get('sku') || 's00168';

  // Generate sample data based on the image
  const generateWeeklyData = (): WeekData[] => {
    const weeks = [
      'Oct 15-18', 'Oct 15-18', 'Oct 22-18', 'Oct 29-18', 'Nov 05-18', 'Nov 12-18', 
      'Nov 19-18', 'Nov 26-18', 'Dec 03-18', 'Dec 10-18', 'Dec 17-18', 'Dec 24-18',
      'Dec 31-18', 'Jan 07', 'Jan 14', 'Jan 21', 'Jan 28', 'Feb 04', 'Feb 11',
      'Feb 18', 'Feb 25', 'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5',
      'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'
    ];

    const actuals = [
      1299, 942, 913, 1181, 1137, 990, 895, 912, 832, 842, 858, 740,
      1408, 1472, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null
    ];

    const durations = [
      169, 143, -3, 6, -11, 308, -200, -140, 367, 76, -165, -101,
      109, -260, null, null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null, null, null
    ];

    const forecasts = [
      1040, 1083, 996, 1176, 1148, 664, 1095, 1052, 465, 766, 673, 841,
      903, 1330, 1242, 1418, 1382, 1549, 1409, 1643, 1482, 2067, 2018,
      1863, 1700, null, null, null, null, null, null, null, null
    ];

    return weeks.map((week, index) => ({
      week,
      actual: actuals[index] || 0,
      forecast: forecasts[index] || 0,
      forecast1: forecasts[index] ? forecasts[index] + Math.random() * 50 - 25 : 0,
      forecast11: forecasts[index] ? forecasts[index] + Math.random() * 40 - 20 : 0,
      forecastUpdate: index > 15 ? Math.random() * 500 - 250 : 0,
      forecastAccuracy: forecasts[index] ? 0.777 + Math.random() * 0.15 : 0,
      duration: durations[index] || 0,
      bias: 0.14 + Math.random() * 0.15,
    }));
  };

  const demandData: DemandData = {
    skuId,
    fca: 0.8421,
    bias: 0.1579,
    weeklyData: generateWeeklyData(),
  };

  return json(demandData);
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

export default function ActionShapeDemandDashboard() {
  const data = useLoaderData<DemandData>();
  const [selectedView, setSelectedView] = useState('chart');
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  const handleViewChange = useCallback((value: string) => setSelectedView(value), []);
  const handleTimeRangeChange = useCallback((value: string) => setSelectedTimeRange(value), []);

  // Prepare chart data (filter out null actuals for cleaner visualization)
  const chartData = data.weeklyData
    .filter(w => w.actual > 0)
    .map(week => ({
      week: week.week,
      Actual: week.actual,
      Forecast: week.forecast,
    }));

  // Prepare data table
  const tableRows = data.weeklyData.map(week => [
    week.week,
    week.actual > 0 ? week.actual.toLocaleString() : '-',
    week.duration !== 0 ? week.duration.toLocaleString() : '-',
    week.forecast > 0 ? week.forecast.toLocaleString() : '-',
    week.forecast1 > 0 ? week.forecast1.toFixed(0) : '-',
    week.forecast11 > 0 ? week.forecast11.toFixed(0) : '-',
    week.forecastUpdate !== 0 ? week.forecastUpdate.toFixed(0) : '-',
    week.forecastAccuracy > 0 ? week.forecastAccuracy.toFixed(3) : '-',
    week.bias.toFixed(3),
  ]);

  return (
    <Page
      title="Action: Understand/shape demand"
      subtitle={`Demand realization vs. forecast (${data.skuId})`}
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
        {/* Metrics Cards */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    FCA (Forecast Accuracy)
                  </Text>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {data.fca.toFixed(4)}
                    </Text>
                    <Icon source={ArrowUpIcon} tone="success" />
                  </InlineStack>
                  <Badge tone="success">Good accuracy</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Bias
                  </Text>
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {data.bias.toFixed(4)}
                    </Text>
                    <Icon source={ArrowDownIcon} tone="warning" />
                  </InlineStack>
                  <Badge tone="warning">Low bias</Badge>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Filters and View Toggle */}
        <Layout.Section>
          <Card>
            <InlineStack gap="400" wrap>
              <Box minWidth="200px">
                <Select
                  label="Time Range"
                  options={[
                    { label: 'All Weeks', value: 'all' },
                    { label: 'Last 12 Weeks', value: '12weeks' },
                    { label: 'Last 6 Weeks', value: '6weeks' },
                  ]}
                  value={selectedTimeRange}
                  onChange={handleTimeRangeChange}
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
        {selectedView === 'chart' ? (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Demand Realization vs. Forecast
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Actual demand compared to forecasted demand by week
                  </Text>
                </BlockStack>

                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                      stroke={POLARIS_COLORS.border}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                      stroke={POLARIS_COLORS.border}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    
                    {/* Actual demand bars */}
                    <Bar dataKey="Actual" fill={POLARIS_COLORS.actual} name="Actual" />
                    
                    {/* Forecast line */}
                    <Line
                      type="monotone"
                      dataKey="Forecast"
                      stroke={POLARIS_COLORS.forecast}
                      strokeWidth={2}
                      name="Forecast"
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>

                <InlineStack gap="400">
                  <InlineStack gap="100" blockAlign="center">
                    <div style={{ width: 16, height: 16, backgroundColor: POLARIS_COLORS.actual, borderRadius: 2 }} />
                    <Text as="span" variant="bodySm">Actual</Text>
                  </InlineStack>
                  <InlineStack gap="100" blockAlign="center">
                    <div style={{ width: 16, height: 3, backgroundColor: POLARIS_COLORS.forecast }} />
                    <Text as="span" variant="bodySm">Forecast</Text>
                  </InlineStack>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        ) : (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd" fontWeight="semibold">
                  Demand Realization vs. Forecast Data Table
                </Text>
                <DataTable
                  columnContentTypes={[
                    'text',
                    'numeric',
                    'numeric',
                    'numeric',
                    'numeric',
                    'numeric',
                    'numeric',
                    'numeric',
                    'numeric',
                  ]}
                  headings={[
                    'Week',
                    'Actual',
                    'Duration',
                    'Forecast 1',
                    'Forecast 1-1',
                    'Forecast Update',
                    'Forecast Accuracy',
                    'Bias',
                  ]}
                  rows={tableRows}
                  hoverable
                  footerContent={
                    <Text as="p" variant="bodySm" tone="subdued">
                      Showing {data.weeklyData.length} weeks of data
                    </Text>
                  }
                />
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {/* Additional Insights */}
        <Layout.Section>
          <Layout>
            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Key Insights
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ArrowUpIcon} tone="success" />
                      <Text as="p" variant="bodyMd">
                        Forecast accuracy is <Text as="span" fontWeight="semibold" tone="success">84.21%</Text> - above target
                      </Text>
                    </InlineStack>
                    <InlineStack gap="200" blockAlign="center">
                      <Icon source={ArrowDownIcon} tone="warning" />
                      <Text as="p" variant="bodyMd">
                        Bias is at <Text as="span" fontWeight="semibold">15.79%</Text> - monitor closely
                      </Text>
                    </InlineStack>
                    <Text as="p" variant="bodySm" tone="subdued">
                      • Recent weeks show improving forecast accuracy
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      • Consider adjusting forecast model to reduce bias
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      • Demand volatility highest in week transitions
                    </Text>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Recommended Actions
                  </Text>
                  <BlockStack gap="200">
                    <Button fullWidth>Review Forecast Model</Button>
                    <Button fullWidth variant="plain">
                      Analyze Demand Patterns
                    </Button>
                    <Button fullWidth variant="plain">
                      Adjust Safety Stock
                    </Button>
                    <Button fullWidth variant="plain">
                      Export Analysis
                    </Button>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
