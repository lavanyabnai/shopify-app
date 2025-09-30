// app/routes/sku-views.tsx
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
  Divider,
  TextField,
  DatePicker,
  Popover,
  Scrollable,
  List,
  Avatar,
  ResourceList,
  ResourceItem,
  Thumbnail,
  ProgressBar,
  Banner,
  Modal,
  TextContainer,
} from '@shopify/polaris';
import {
  CalendarIcon,
  InfoIcon,
  AlertCircleIcon,
  ArrowUpIcon as TrendingUpIcon,
  ArrowDownIcon as TrendingDownIcon,
  ProductIcon as PackageIcon,
  DeliveryIcon as TruckIcon,
  InventoryIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@shopify/polaris-icons';
import {
  AreaChart,
  Area,
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
  ReferenceLine,
  ReferenceArea,
  Brush,
  Cell,
} from 'recharts';

// Types
interface SKUTrend {
  date: string;
  otifCommit: number;
  otifShip: number;
  backorders: number;
  forecast?: number;
}

interface InventoryData {
  date: string;
  onHand: number;
  projected: number;
  safetyStock: number;
  production: number;
  demand: number;
  isToday?: boolean;
  isPast?: boolean;
}

interface ActionItem {
  id: string;
  type: 'reorder' | 'increase_production' | 'expedite' | 'review';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
}

interface SKUViewData {
  skuId: string;
  skuName: string;
  currentMetrics: {
    otifCommit: number;
    otifShip: number;
    endBackorders: number;
    currentInventory: number;
    weeksCover: number;
    avgDemand: number;
  };
  serviceTrends: SKUTrend[];
  inventoryProjection: InventoryData[];
  actions: ActionItem[];
  alerts: {
    type: 'critical' | 'warning' | 'info';
    message: string;
  }[];
  forecastAccuracy: number;
  leadTime: number;
  reorderPoint: number;
  safetyStockLevel: number;
}

// Loader
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const skuId = url.searchParams.get('sku') || 's00168';

  // Generate sample data - in production, fetch from FastAPI
  const generateServiceTrends = (): SKUTrend[] => {
    const trends: SKUTrend[] = [];
    const startDate = new Date('2018-10-01');
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simulate realistic patterns
      const baseOtif = 85 + Math.sin(i / 10) * 10;
      const variation = Math.random() * 5;
      
      trends.push({
        date: date.toISOString().split('T')[0],
        otifCommit: Math.min(100, Math.max(0, baseOtif + variation)),
        otifShip: Math.min(100, Math.max(0, baseOtif - 2 + variation)),
        backorders: Math.max(0, 100 - baseOtif) * 20 + Math.random() * 50,
        forecast: i > 60 ? baseOtif - 5 + Math.random() * 10 : undefined,
      });
    }
    
    return trends;
  };

  const generateInventoryProjection = (): InventoryData[] => {
    const projection: InventoryData[] = [];
    const startDate = new Date('2018-10-01');
    let currentInventory = 15000;
    
    for (let i = 0; i < 120; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const isToday = i === 60;
      const isPast = i < 60;
      const dailyDemand = 300 + Math.random() * 100;
      const production = i % 7 === 0 ? 3000 : 0; // Weekly production
      
      currentInventory = currentInventory - dailyDemand + production;
      currentInventory = Math.max(0, currentInventory);
      
      projection.push({
        date: date.toISOString().split('T')[0],
        onHand: isPast ? currentInventory : 0,
        projected: !isPast ? currentInventory : 0,
        safetyStock: 3000,
        production: production,
        demand: dailyDemand,
        isToday,
        isPast,
      });
    }
    
    return projection;
  };

  const skuData: SKUViewData = {
    skuId: skuId,
    skuName: `SKU ${skuId.toUpperCase()} - Product Description`,
    currentMetrics: {
      otifCommit: 76,
      otifShip: 74,
      endBackorders: 2450,
      currentInventory: 8500,
      weeksCover: 3.2,
      avgDemand: 350,
    },
    serviceTrends: generateServiceTrends(),
    inventoryProjection: generateInventoryProjection(),
    actions: [
      {
        id: '1',
        type: 'reorder',
        priority: 'critical',
        title: 'Reorder Stock',
        description: 'Current inventory below reorder point. Immediate action required.',
        impact: 'Prevent stockout in 2 weeks',
        dueDate: '2018-12-26',
        status: 'pending',
      },
      {
        id: '2',
        type: 'increase_production',
        priority: 'high',
        title: 'Increase Production',
        description: 'Demand trending 15% above forecast. Consider increasing production capacity.',
        impact: 'Meet increased demand',
        dueDate: '2018-12-28',
        status: 'pending',
      },
      {
        id: '3',
        type: 'review',
        priority: 'medium',
        title: 'Review Safety Stock',
        description: 'Volatility has increased. Review and adjust safety stock levels.',
        impact: 'Reduce stockout risk',
        dueDate: '2019-01-05',
        status: 'in_progress',
      },
    ],
    alerts: [
      {
        type: 'critical',
        message: 'Inventory will reach safety stock level in 8 weeks at current demand rate',
      },
      {
        type: 'warning',
        message: 'OTIF performance below target for 3 consecutive weeks',
      },
      {
        type: 'info',
        message: 'Next scheduled production run: Jan 1, 2019',
      },
    ],
    forecastAccuracy: 82.5,
    leadTime: 14,
    reorderPoint: 5000,
    safetyStockLevel: 3000,
  };

  return json(skuData);
};

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
};

// Custom components
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
            {entry.name}: {typeof entry.value === 'number' ? 
              entry.value.toFixed(entry.name.includes('%') ? 1 : 0) : 
              entry.value}
            {entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ActionCard = ({ action, onComplete }: { action: ActionItem; onComplete: (id: string) => void }) => {
  const toneMap = {
    critical: 'critical' as const,
    high: 'warning' as const,
    medium: 'info' as const,
    low: 'info' as const,
  };

  const iconMap = {
    reorder: PackageIcon,
    increase_production: TrendingUpIcon,
    expedite: TruckIcon,
    review: InfoIcon,
  };

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between">
          <InlineStack gap="200">
            <Icon source={iconMap[action.type]} tone={toneMap[action.priority]} />
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              {action.title}
            </Text>
          </InlineStack>
          <Badge tone={toneMap[action.priority]}>
            {action.priority}
          </Badge>
        </InlineStack>
        <Text as="p" variant="bodySm" tone="subdued">
          {action.description}
        </Text>
        <InlineStack gap="400">
          <InlineStack gap="100">
            <Icon source={ClockIcon} tone="subdued" />
            <Text as="span" variant="bodySm" tone="subdued">
              Due: {action.dueDate}
            </Text>
          </InlineStack>
          <Text as="span" variant="bodySm" tone="success">
            Impact: {action.impact}
          </Text>
        </InlineStack>
        <InlineStack gap="200">
          <Button size="slim" onClick={() => onComplete(action.id)}>
            Mark Complete
          </Button>
          <Button size="slim" variant="plain">
            View Details
          </Button>
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export default function SKUViewsDashboard() {
  const data = useLoaderData<SKUViewData>();
  const [selectedTimeRange, setSelectedTimeRange] = useState('90days');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [datePickerActive, setDatePickerActive] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeModal, setActiveModal] = useState(false);

  const handleTimeRangeChange = useCallback((value: string) => setSelectedTimeRange(value), []);
  const handleMetricChange = useCallback((value: string) => setSelectedMetric(value), []);
  const toggleDatePicker = useCallback(() => setDatePickerActive(!datePickerActive), [datePickerActive]);

  const handleActionComplete = (actionId: string) => {
    console.log('Completing action:', actionId);
    // In production, this would update the backend
  };

  // Prepare chart data
  const serviceTrendData = data.serviceTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'OTIF Commit': trend.otifCommit,
    'OTIF Ship': trend.otifShip,
    'Backorders': trend.backorders / 10, // Scale for visualization
    'Forecast': trend.forecast,
  }));

  const inventoryData = data.inventoryProjection.map(inv => ({
    date: new Date(inv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'On Hand': inv.onHand / 1000, // Convert to thousands
    'Projected': inv.projected / 1000,
    'Safety Stock': inv.safetyStock / 1000,
    'Production': inv.production / 1000,
    'Demand': inv.demand / 1000,
    isToday: inv.isToday,
    isPast: inv.isPast,
  }));

  const metricsCards = [
    {
      label: 'OTIF Commit',
      value: `${data.currentMetrics.otifCommit}%`,
      change: '-2%',
      trend: 'down',
      tone: 'warning' as const,
    },
    {
      label: 'OTIF Ship',
      value: `${data.currentMetrics.otifShip}%`,
      change: '-3%',
      trend: 'down',
      tone: 'warning' as const,
    },
    {
      label: 'End Backorders',
      value: data.currentMetrics.endBackorders.toLocaleString(),
      change: '+15%',
      trend: 'up',
      tone: 'critical' as const,
    },
    {
      label: 'Current Inventory',
      value: data.currentMetrics.currentInventory.toLocaleString(),
      change: `${data.currentMetrics.weeksCover} weeks`,
      trend: 'stable',
      tone: 'info' as const,
    },
    {
      label: 'Forecast Accuracy',
      value: `${data.forecastAccuracy}%`,
      change: '+2%',
      trend: 'up',
      tone: 'success' as const,
    },
    {
      label: 'Lead Time',
      value: `${data.leadTime} days`,
      change: 'Stable',
      trend: 'stable',
      tone: 'info' as const,
    },
  ];

  return (
    <Page
      title="SKU Views"
      titleMetadata={<Badge tone="info">{data.skuId.toUpperCase()}</Badge>}
      subtitle={data.skuName}
      primaryAction={{
        content: 'Export Analysis',
        onAction: () => console.log('Export'),
      }}
      secondaryActions={[
        {
          content: 'Run Optimization',
          onAction: () => setActiveModal(true),
        },
        {
          content: 'View History',
          onAction: () => console.log('View history'),
        },
      ]}
    >
      <Layout>
        {/* Alerts Section */}
        {data.alerts.length > 0 && (
          <Layout.Section>
            <BlockStack gap="300">
              {data.alerts.map((alert, index) => (
                <Banner
                  key={index}
                  tone={alert.type === 'critical' ? 'critical' : alert.type === 'warning' ? 'warning' : 'info'}
                  onDismiss={() => console.log('Dismiss alert')}
                >
                  <p>{alert.message}</p>
                </Banner>
              ))}
            </BlockStack>
          </Layout.Section>
        )}

        {/* Metrics Cards */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            {metricsCards.map((metric, index) => (
              <Box key={index} minWidth="160px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {metric.label}
                    </Text>
                    <InlineStack align="space-between" blockAlign="center">
                      <Text as="p" variant="headingLg" fontWeight="bold">
                        {metric.value}
                      </Text>
                      {metric.trend !== 'stable' && (
                        <Icon
                          source={metric.trend === 'up' ? TrendingUpIcon : TrendingDownIcon}
                          tone={metric.tone}
                        />
                      )}
                    </InlineStack>
                    <Badge tone={metric.tone}>
                      {metric.change}
                    </Badge>
                  </BlockStack>
                </Card>
              </Box>
            ))}
          </InlineStack>
        </Layout.Section>

        {/* Main Content Grid */}
        <Layout>
          {/* Left Column - Charts */}
          <Layout.Section>
            <BlockStack gap="400">
              {/* Service Trends Chart */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Service SKU Trends ({data.skuId.toUpperCase()})
                    </Text>
                    <InlineStack gap="200">
                      <Select
                        label=""
                        labelHidden
                        options={[
                          { label: '30 Days', value: '30days' },
                          { label: '90 Days', value: '90days' },
                          { label: '180 Days', value: '180days' },
                        ]}
                        value={selectedTimeRange}
                        onChange={handleTimeRangeChange}
                      />
                      <Popover
                        active={datePickerActive}
                        activator={
                          <Button
                            onClick={toggleDatePicker}
                            icon={CalendarIcon}
                            disclosure
                          >
                            Custom Range
                          </Button>
                        }
                        onClose={toggleDatePicker}
                      >
                        <DatePicker
                          month={selectedDate.getMonth()}
                          year={selectedDate.getFullYear()}
                          onChange={(date) => setSelectedDate(date.start)}
                          onMonthChange={(month, year) => setSelectedDate(new Date(year, month))}
                        />
                      </Popover>
                    </InlineStack>
                  </InlineStack>

                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={serviceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                      <XAxis 
                        dataKey="date"
                        tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                        stroke={POLARIS_COLORS.border}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }} stroke={POLARIS_COLORS.border} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }} stroke={POLARIS_COLORS.border} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <ReferenceLine yAxisId="left" y={95} stroke={POLARIS_COLORS.success} strokeDasharray="5 5" />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="OTIF Commit"
                        stroke={POLARIS_COLORS.tertiary}
                        fill={POLARIS_COLORS.tertiary}
                        fillOpacity={0.3}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="OTIF Ship"
                        stroke={POLARIS_COLORS.primary}
                        strokeWidth={2}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="Backorders"
                        fill={POLARIS_COLORS.warning}
                        opacity={0.7}
                      />
                      {data.serviceTrends.some(t => t.forecast) && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Forecast"
                          stroke={POLARIS_COLORS.secondary}
                          strokeDasharray="5 5"
                          strokeWidth={2}
                        />
                      )}
                      <Brush dataKey="date" height={30} stroke={POLARIS_COLORS.subdued} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </BlockStack>
              </Card>

              {/* Inventory Projection Chart */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <BlockStack gap="100">
                      <Text as="h2" variant="headingMd" fontWeight="semibold">
                        Past and Projected Inventory ({data.skuId.toUpperCase()})
                      </Text>
                      <Text as="p" variant="bodySm" tone="subdued">
                        Units in thousands (K)
                      </Text>
                    </BlockStack>
                    <ButtonGroup variant="segmented">
                      <Button pressed={selectedMetric === 'all'} onClick={() => setSelectedMetric('all')}>
                        All Metrics
                      </Button>
                      <Button pressed={selectedMetric === 'inventory'} onClick={() => setSelectedMetric('inventory')}>
                        Inventory Only
                      </Button>
                      <Button pressed={selectedMetric === 'demand'} onClick={() => setSelectedMetric('demand')}>
                        Demand/Supply
                      </Button>
                    </ButtonGroup>
                  </InlineStack>

                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={inventoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={POLARIS_COLORS.border} />
                      <XAxis 
                        dataKey="date"
                        tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }}
                        stroke={POLARIS_COLORS.border}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11, fill: POLARIS_COLORS.subdued }} stroke={POLARIS_COLORS.border} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      
                      {/* Today marker */}
                      <ReferenceLine x="Dec 1" stroke={POLARIS_COLORS.critical} strokeWidth={2} label="Today" />
                      
                      {/* Safety stock line */}
                      <ReferenceLine y={3} stroke={POLARIS_COLORS.warning} strokeDasharray="5 5" label="Safety Stock" />
                      
                      {/* 8 weeks ahead marker */}
                      <ReferenceArea x1="Dec 1" x2="Jan 26" fill="#FFF4E6" fillOpacity={0.3} />
                      
                      {/* Past inventory (on hand) */}
                      <Area
                        type="monotone"
                        dataKey="On Hand"
                        stroke={POLARIS_COLORS.text}
                        fill={POLARIS_COLORS.text}
                        fillOpacity={0.6}
                      />
                      
                      {/* Projected inventory */}
                      <Area
                        type="monotone"
                        dataKey="Projected"
                        stroke={POLARIS_COLORS.tertiary}
                        fill={POLARIS_COLORS.tertiary}
                        fillOpacity={0.3}
                        strokeDasharray="3 3"
                      />
                      
                      {/* Production bars */}
                      {(selectedMetric === 'all' || selectedMetric === 'demand') && (
                        <Bar dataKey="Production" fill={POLARIS_COLORS.success} opacity={0.7} />
                      )}
                      
                      {/* Demand line */}
                      {(selectedMetric === 'all' || selectedMetric === 'demand') && (
                        <Line
                          type="monotone"
                          dataKey="Demand"
                          stroke={POLARIS_COLORS.critical}
                          strokeWidth={1}
                          dot={false}
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>

                  <InlineStack gap="400">
                    <InlineStack gap="100" blockAlign="center">
                      <div style={{ width: 12, height: 12, backgroundColor: POLARIS_COLORS.text, borderRadius: 2 }} />
                      <Text as="span" variant="bodySm">Past Inventory</Text>
                    </InlineStack>
                    <InlineStack gap="100" blockAlign="center">
                      <div style={{ width: 12, height: 12, backgroundColor: POLARIS_COLORS.tertiary, borderRadius: 2 }} />
                      <Text as="span" variant="bodySm">Projected Inventory</Text>
                    </InlineStack>
                    <InlineStack gap="100" blockAlign="center">
                      <div style={{ width: 12, height: 12, backgroundColor: POLARIS_COLORS.success, borderRadius: 2 }} />
                      <Text as="span" variant="bodySm">Production</Text>
                    </InlineStack>
                    <InlineStack gap="100" blockAlign="center">
                      <div style={{ width: 12, height: 12, backgroundColor: POLARIS_COLORS.critical, borderRadius: 2 }} />
                      <Text as="span" variant="bodySm">Demand</Text>
                    </InlineStack>
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          {/* Right Column - Actions */}
          <Layout.Section>
            <BlockStack gap="400">
              {/* Actions Header */}
              <Card>
                <BlockStack gap="300">
                  <InlineStack align="space-between">
                    <Text as="h2" variant="headingMd" fontWeight="semibold">
                      Actions
                    </Text>
                    <Badge tone="warning">{`${data.actions.filter(a => a.status === 'pending').length} Pending`}</Badge>
                  </InlineStack>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Recommended actions based on current trends and projections
                  </Text>
                </BlockStack>
              </Card>

              {/* Action Cards */}
              {data.actions.map(action => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onComplete={handleActionComplete}
                />
              ))}

              {/* Key Insights */}
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Key Insights
                  </Text>
                  <List type="bullet">
                    <List.Item>
                      Inventory will reach safety stock in <Text as="span" fontWeight="semibold" tone="critical">8 weeks</Text>
                    </List.Item>
                    <List.Item>
                      OTIF performance declining - investigate root cause
                    </List.Item>
                    <List.Item>
                      Demand variance increased by 15% this month
                    </List.Item>
                    <List.Item>
                      Consider adjusting reorder point to {(data.reorderPoint * 1.2).toLocaleString()} units
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>

              {/* Quick Actions */}
              <Card>
                <BlockStack gap="300">
                  <Text as="h2" variant="headingMd" fontWeight="semibold">
                    Quick Actions
                  </Text>
                  <BlockStack gap="200">
                    <Button fullWidth onClick={() => console.log('Create reorder')}>
                      Create Reorder
                    </Button>
                    <Button fullWidth variant="plain" onClick={() => console.log('Adjust forecast')}>
                      Adjust Forecast
                    </Button>
                    <Button fullWidth variant="plain" onClick={() => console.log('Run simulation')}>
                      Run Simulation
                    </Button>
                    <Button fullWidth variant="plain" onClick={() => console.log('Export data')}>
                      Export Data
                    </Button>
                  </BlockStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </Layout>

      {/* Optimization Modal */}
      <Modal
        open={activeModal}
        onClose={() => setActiveModal(false)}
        title="Run Optimization"
        primaryAction={{
          content: 'Run',
          onAction: () => {
            console.log('Running optimization...');
            setActiveModal(false);
          },
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setActiveModal(false),
          },
        ]}
      >
        <Modal.Section>
          <TextContainer>
            <p>
              Configure optimization parameters for {data.skuId.toUpperCase()}:
            </p>
            <BlockStack gap="300">
              <TextField
                label="Target Service Level (%)"
                type="number"
                value="95"
                onChange={() => {}}
                autoComplete="off"
              />
              <TextField
                label="Maximum Investment ($)"
                type="number"
                value="50000"
                onChange={() => {}}
                autoComplete="off"
              />
              <Select
                label="Optimization Objective"
                options={[
                  { label: 'Minimize Cost', value: 'cost' },
                  { label: 'Maximize Service', value: 'service' },
                  { label: 'Balance Cost/Service', value: 'balanced' },
                ]}
                value="balanced"
                onChange={() => {}}
              />
            </BlockStack>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </Page>
  );
}