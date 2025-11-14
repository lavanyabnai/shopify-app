import { useState } from "react"
import {
  Layout,
  Card,
  Badge,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Banner,
} from "@shopify/polaris"
import {
  ChartVerticalIcon,
  AlertTriangleIcon,
  PackageIcon,
  ClockIcon,
} from "@shopify/polaris-icons"
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
  Cell,
} from 'recharts'

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
}

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
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

interface DashboardCardProps {
  title: string
  icon?: any
  children: React.ReactNode
  action?: React.ReactNode
}

function DashboardCard({ title, icon: Icon, children, action }: DashboardCardProps) {
  return (
    <Card>
      <BlockStack gap="400">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            {Icon && (
              <div style={{ width: "16px", height: "16px" }}>
                <Icon />
              </div>
            )}
            <Text variant="headingMd" as="h3">
              {title}
            </Text>
          </InlineStack>
          {action}
        </InlineStack>
        {children}
      </BlockStack>
    </Card>
  )
}

export default function ManufacturingDashboard() {
  // Master Scheduling Summary Data
  const masterScheduleData = [
    { metric: "Total Orders", value: 1247, change: "+5.2%", trend: "up" },
    { metric: "Past Due", value: 23, change: "-12%", trend: "down" },
    { metric: "At Risk", value: 156, change: "+8%", trend: "up" },
    { metric: "On Track", value: 1068, change: "+3%", trend: "up" },
  ]

  // Revenue At Risk Heatmap Data - transformed for stacked bar chart
  const revenueRiskChartData = [
    { week: "Week 1", "META Quest Pro": 85, "META Quest 3": 45, "META Ray-Ban": 35, "Portal Plus": 15 },
    { week: "Week 2", "META Quest Pro": 92, "META Quest 3": 52, "META Ray-Ban": 28, "Portal Plus": 22 },
    { week: "Week 3", "META Quest Pro": 78, "META Quest 3": 68, "META Ray-Ban": 42, "Portal Plus": 18 },
    { week: "Week 4", "META Quest Pro": 95, "META Quest 3": 72, "META Ray-Ban": 38, "Portal Plus": 25 },
  ]

  // Orders Past Due Heatmap Data
  const pastDueChartData = [
    { week: "Week 1", "Austin, TX": 12, "Fremont, CA": 5, "Reno, NV": 3, "Phoenix, AZ": 3 },
    { week: "Week 2", "Austin, TX": 8, "Fremont, CA": 12, "Reno, NV": 5, "Phoenix, AZ": 3 },
    { week: "Week 3", "Austin, TX": 15, "Fremont, CA": 7, "Reno, NV": 8, "Phoenix, AZ": 5 },
    { week: "Week 4", "Austin, TX": 5, "Fremont, CA": 10, "Reno, NV": 6, "Phoenix, AZ": 4 },
  ]

  // Asset Utilization Data
  const assetUtilizationData = [
    { asset: "Assembly Line 1", utilization: 95 },
    { asset: "Assembly Line 2", utilization: 87 },
    { asset: "Testing Station A", utilization: 72 },
    { asset: "Packaging Unit 1", utilization: 65 },
    { asset: "Quality Control", utilization: 58 },
  ]

  // Demand Change Data
  const demandChangeData = [
    { product: "META Quest Pro", previous: 1200, current: 1450, change: 20.8 },
    { product: "META Quest 3", previous: 850, current: 780, change: -8.2 },
    { product: "META Ray-Ban", previous: 650, current: 720, change: 10.8 },
    { product: "Portal Plus", previous: 420, current: 380, change: -9.5 },
  ]

  // Constraints Data
  const constraintsData = [
    { constraint: "Component Shortage", impact: "High", affected: 23 },
    { constraint: "Labor Capacity", impact: "Medium", affected: 12 },
    { constraint: "Equipment Downtime", impact: "High", affected: 8 },
    { constraint: "Logistics Delay", impact: "Low", affected: 5 },
  ]

  // Ending Inventory Data
  const inventoryData = [
    { product: "META Quest Pro", current: 3450, target: 3000, variance: 15 },
    { product: "META Quest 3", current: 2180, target: 2500, variance: -12.8 },
    { product: "META Ray-Ban", current: 1820, target: 1800, variance: 1.1 },
    { product: "Portal Plus", current: 890, target: 1000, variance: -11 },
  ]

  // Plan Adherence Data
  const planAdherenceData = [
    { week: "Week 1", planned: 320, actual: 312, adherence: 97.5 },
    { week: "Week 2", planned: 340, actual: 328, adherence: 96.5 },
    { week: "Week 3", planned: 360, actual: 342, adherence: 95 },
    { week: "Week 4", planned: 380, actual: 365, adherence: 96.1 },
  ]

  // Component Shortages Data
  const shortagesData = [
    { component: "Display Panels", shortage: 450, orders: 12 },
    { component: "Battery Packs", shortage: 280, orders: 8 },
    { component: "Circuit Boards", shortage: 150, orders: 5 },
    { component: "Lens Assemblies", shortage: 95, orders: 3 },
  ]

  const getBarColor = (value: number, threshold1: number, threshold2: number) => {
    if (value >= threshold1) return COLORS.critical
    if (value >= threshold2) return COLORS.warning
    return COLORS.success
  }

  return (
    <BlockStack gap="400">
      <Text variant="headingLg" as="h2">
        META VR Manufacturing Dashboard
      </Text>

      <Layout>
        {/* Master Scheduling Summary */}
        <Layout.Section>
          <DashboardCard title="Master Scheduling Summary" icon={ChartVerticalIcon}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={masterScheduleData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={COLORS.primary}>
                  {masterScheduleData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.metric === "Past Due"
                          ? COLORS.critical
                          : entry.metric === "At Risk"
                          ? COLORS.warning
                          : COLORS.success
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <InlineStack gap="400" wrap>
              {masterScheduleData.map((item, index) => (
                <Box key={index} minWidth="120px">
                  <BlockStack gap="100">
                    <Text variant="bodySm" tone="subdued" as="span">
                      {item.metric}
                    </Text>
                    <Text variant="headingMd" fontWeight="bold" as="span">
                      {item.value.toLocaleString()}
                    </Text>
                    <Badge tone={item.trend === "up" && item.metric !== "Past Due" ? "success" : item.trend === "down" && item.metric === "Past Due" ? "success" : "critical"}>
                      {item.change}
                    </Badge>
                  </BlockStack>
                </Box>
              ))}
            </InlineStack>
          </DashboardCard>
        </Layout.Section>

        {/* Revenue At Risk Heatmap */}
        <Layout.Section>
          <DashboardCard title="Revenue At Risk Heatmap ($K)" icon={AlertTriangleIcon}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={revenueRiskChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="META Quest Pro" stackId="a" fill={COLORS.critical} />
                <Bar dataKey="META Quest 3" stackId="a" fill={COLORS.warning} />
                <Bar dataKey="META Ray-Ban" stackId="a" fill={COLORS.secondary} />
                <Bar dataKey="Portal Plus" stackId="a" fill={COLORS.tertiary} />
              </BarChart>
            </ResponsiveContainer>
            <Banner tone="critical">
              <Text as="p" variant="bodySm">
                Total revenue at risk: $1,247K across 4 product lines
              </Text>
            </Banner>
          </DashboardCard>
        </Layout.Section>

        {/* Orders Past Due Heatmap */}
        <Layout.Section>
          <DashboardCard title="Orders Past Due by Facility" icon={ClockIcon}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={pastDueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Austin, TX" fill={COLORS.critical} />
                <Bar dataKey="Fremont, CA" fill={COLORS.warning} />
                <Bar dataKey="Reno, NV" fill={COLORS.secondary} />
                <Bar dataKey="Phoenix, AZ" fill={COLORS.tertiary} />
              </BarChart>
            </ResponsiveContainer>
          </DashboardCard>
        </Layout.Section>

        {/* Asset Utilization */}
        <Layout.Section>
          <DashboardCard title="Asset Utilization" icon={ChartVerticalIcon}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assetUtilizationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis dataKey="asset" type="category" width={150} tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="utilization" name="Utilization %">
                  {assetUtilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization, 90, 80)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Banner tone="warning">
              <Text as="p" variant="bodySm">
                Assembly Line 1 operating at critical capacity (95%). Consider load balancing.
              </Text>
            </Banner>
          </DashboardCard>
        </Layout.Section>

        {/* Demand Change Analysis */}
        <Layout.Section>
          <DashboardCard title="Demand Change Analysis" icon={ChartVerticalIcon}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={demandChangeData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="product" tick={{ fontSize: 11, fill: COLORS.subdued }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="previous" fill={COLORS.subdued} name="Previous" />
                <Bar dataKey="current" fill={COLORS.primary} name="Current" />
              </BarChart>
            </ResponsiveContainer>
          </DashboardCard>
        </Layout.Section>

        {/* Constraints Impacting MPS */}
        <Layout.Section>
          <DashboardCard title="Constraints Impacting MPS" icon={AlertTriangleIcon}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={constraintsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis type="number" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis dataKey="constraint" type="category" width={150} tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="affected" name="Orders Affected">
                  {constraintsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.impact === "High" ? COLORS.critical : entry.impact === "Medium" ? COLORS.warning : COLORS.tertiary}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <Banner tone="critical">
              <Text as="p" variant="bodySm">
                48 total orders impacted by constraints. Prioritize component shortage resolution.
              </Text>
            </Banner>
          </DashboardCard>
        </Layout.Section>

        {/* Ending Inventory vs Target */}
        <Layout.Section>
          <DashboardCard title="Ending Inventory vs Target" icon={PackageIcon}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="product" tick={{ fontSize: 11, fill: COLORS.subdued }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="current" fill={COLORS.primary} name="Current" />
                <Bar dataKey="target" fill={COLORS.secondary} name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </DashboardCard>
        </Layout.Section>

        {/* Plan Adherence */}
        <Layout.Section>
          <DashboardCard title="Plan Adherence" icon={ChartVerticalIcon}>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={planAdherenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis yAxisId="right" orientation="right" domain={[90, 100]} tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="planned" fill={COLORS.subdued} name="Planned" />
                <Bar yAxisId="left" dataKey="actual" fill={COLORS.primary} name="Actual" />
                <Line yAxisId="right" type="monotone" dataKey="adherence" stroke={COLORS.critical} strokeWidth={2} name="Adherence %" />
              </ComposedChart>
            </ResponsiveContainer>
            <Banner tone="success">
              <Text as="p" variant="bodySm">
                Average plan adherence: 96.3%. Maintaining strong execution to plan.
              </Text>
            </Banner>
          </DashboardCard>
        </Layout.Section>

        {/* Component Shortages Impacting MPS */}
        <Layout.Section>
          <DashboardCard title="Component Shortages Impacting MPS" icon={AlertTriangleIcon}>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={shortagesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                <XAxis dataKey="component" tick={{ fontSize: 11, fill: COLORS.subdued }} angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar yAxisId="left" dataKey="shortage" fill={COLORS.warning} name="Shortage Qty" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke={COLORS.critical} strokeWidth={2} name="Orders Impacted" />
              </ComposedChart>
            </ResponsiveContainer>
            <Banner tone="critical">
              <Text as="p" variant="bodySm">
                Critical: Display Panels shortage affecting 12 high-priority orders. Expedite supplier delivery.
              </Text>
            </Banner>
          </DashboardCard>
        </Layout.Section>
      </Layout>
    </BlockStack>
  )
}
