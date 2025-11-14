import { useState } from "react"
import { Link } from "@remix-run/react"
import {
  Page,
  Layout,
  Card,
  Badge,
  Text,
  InlineStack,
  BlockStack,
  Box,
  Button,
  Tabs,
  Banner,
  ProgressBar,
  Modal,
  FormLayout,
  TextField,
  Select,
} from "@shopify/polaris"
import {
  PackageIcon,
  AlertTriangleIcon,
  ClockIcon,
  DeliveryIcon,
  TargetIcon,
  PersonIcon,
  ChartVerticalIcon,
} from "@shopify/polaris-icons"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

interface DemandData {
  sourceLocation: string
  materialCode: string
  revenueImpact: number
  unitImpact: number
  impactCoverage: number
  confidenceLevel: number
  predictedAction: string
  actionPriority: string
  dueDate: string
  description: string
  alertType: string
  transferLeadTime: string
  currentStock: number
  projectedDemand: number
}

interface DemandBalancingDashboardProps {
  demandData: DemandData
}

export default function DemandBalancingDashboard({ demandData }: DemandBalancingDashboardProps) {
  const [selectedTab, setSelectedTab] = useState(0)
  const [isExpediteModalActive, setIsExpediteModalActive] = useState(false)
  const [isContactModalActive, setIsContactModalActive] = useState(false)
  const [isForecastModalActive, setIsForecastModalActive] = useState(false)
  const [isReportModalActive, setIsReportModalActive] = useState(false)

  const stockCoverage = (demandData.currentStock / demandData.projectedDemand) * 100
  const backorderUnits = Math.max(0, demandData.projectedDemand - demandData.currentStock)
  const isHighPriority = demandData.actionPriority === "High"
  const isLowStock = demandData.actionPriority === "High" || demandData.actionPriority === "Critical"

  // Mock forecast data
  const forecastData = [
    { week: "Week 1", projected: 3200, actual: 3100, backorder: 100 },
    { week: "Week 2", projected: 3800, actual: 3200, backorder: 600 },
    { week: "Week 3", projected: 4200, actual: 3000, backorder: 1200 },
    { week: "Week 4", projected: 4800, actual: 2800, backorder: 2000 },
    { week: "Week 5", projected: 5200, actual: 2600, backorder: 2600 },
  ]

  // Mock inventory availability data
  const inventoryData = [
    { location: "META-CA-01", available: 12450, allocated: 8200, transit: 1500 },
    { location: "META-TX-01", available: 8920, allocated: 6500, transit: 800 },
    { location: "META-EU-01", available: 15680, allocated: 12000, transit: 2200 },
    { location: "META-APAC-01", available: 4560, allocated: 3800, transit: 600 },
  ]

  // Alternative recommendations
  const alternatives = [
    {
      title: "Option 1: Direct Transfer",
      description: "Transfer units directly from source to destination",
      cost: "$45,000",
      leadTime: "3-5 days",
      riskLevel: "Low",
      impact: "Moderate",
    },
    {
      title: "Option 2: Hub Consolidation",
      description: "Consolidate inventory through regional hub before distribution",
      cost: "$28,000",
      leadTime: "5-7 days",
      riskLevel: "Medium",
      impact: "High",
    },
    {
      title: "Option 3: Emergency Manufacturing",
      description: "Expedite manufacturing to meet demand shortfall",
      cost: "$85,000",
      leadTime: "14-21 days",
      riskLevel: "High",
      impact: "Very High",
    },
  ]

  const tabs = [
    { id: "overview", content: "Overview", panelID: "overview-panel" },
    { id: "forecast", content: "Forecast & Backorders", panelID: "forecast-panel" },
    { id: "inventory", content: "Inventory Availability", panelID: "inventory-panel" },
    { id: "impact", content: "Implementation Impact", panelID: "impact-panel" },
    { id: "alternatives", content: "Alternatives", panelID: "alternatives-panel" },
  ]

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
      case "Critical":
        return <Badge tone="critical">{priority}</Badge>
      case "Medium":
        return <Badge tone="warning">{priority}</Badge>
      default:
        return <Badge tone="info">{priority}</Badge>
    }
  }

  return (
    <Page
      fullWidth
      title={demandData.materialCode}
      subtitle={demandData.sourceLocation}
      backAction={{ content: "Back to Demand Balancing", url: "/inv/demand-balancing" }}
      titleMetadata={
        <InlineStack gap="200">
          {getPriorityBadge(demandData.actionPriority)}
          <Badge tone="info">{demandData.alertType}</Badge>
          <Text as="span" variant="bodySm" tone="subdued">
            Due: {demandData.dueDate}
          </Text>
        </InlineStack>
      }
    >
      <Layout>
        {/* Header Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="p" variant="bodyMd">
                {demandData.description}
              </Text>
              <InlineStack align="end">
                <Box>
                  <Text as="p" variant="headingLg" fontWeight="bold">
                    ${(demandData.revenueImpact / 1000000).toFixed(2)}M
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Revenue Impact
                  </Text>
                </Box>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Key Metrics Grid */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Stock Coverage
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <PackageIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {stockCoverage.toFixed(2)}%
                  </Text>
                  <ProgressBar progress={Number(stockCoverage.toFixed(2))} size="small" />
                  <Text as="p" variant="bodySm" tone="subdued">
                    {demandData.currentStock.toLocaleString()} / {demandData.projectedDemand.toLocaleString()} demand
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Projected Backorders
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <AlertTriangleIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold" tone="critical">
                    {backorderUnits.toLocaleString()}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    units short of demand
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="semibold" tone="critical">
                    {((backorderUnits / demandData.projectedDemand) * 100).toFixed(1)}% shortfall
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Transfer Lead Time
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <ClockIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {demandData.transferLeadTime}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    estimated delivery
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    {demandData.predictedAction} recommended
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Confidence Level
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <TargetIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {demandData.confidenceLevel.toFixed(1)}%
                  </Text>
                  <ProgressBar progress={demandData.confidenceLevel} size="small" tone="success" />
                  <Text as="p" variant="bodySm" tone="subdued">
                    forecast accuracy
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Main Content Tabs */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box padding="400">
                {selectedTab === 0 && (
                  <Layout>
                    <Layout.Section variant="oneThird">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Quick Actions
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Manage this product inventory
                          </Text>
                          <Button
                            variant={isLowStock ? "primary" : "secondary"}
                            onClick={() => setIsExpediteModalActive(true)}
                            icon={DeliveryIcon}
                          >
                            Transfer Shipment
                          </Button>
                          <Button onClick={() => setIsContactModalActive(true)} icon={PersonIcon}>
                            Contact {demandData.sourceLocation}
                          </Button>
                          <Button onClick={() => setIsForecastModalActive(true)} icon={AlertTriangleIcon}>
                            Update Forecast
                          </Button>
                          <Button onClick={() => setIsReportModalActive(true)} icon={ChartVerticalIcon}>
                            Generate Report
                          </Button>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <InlineStack align="space-between">
                            <Text variant="headingMd" as="h3">
                              Alert Description & Analysis
                            </Text>
                            <div style={{ width: '16px', height: '16px' }}>
                              <AlertTriangleIcon />
                            </div>
                          </InlineStack>

                          <Banner tone="warning" title="Current Situation">
                            <Text as="p" variant="bodyMd">
                              {demandData.description}
                            </Text>
                          </Banner>

                          <Layout>
                            <Layout.Section variant="oneHalf">
                              <BlockStack gap="200">
                                <Text variant="headingSm" as="h4">
                                  Impact Metrics
                                </Text>
                                <BlockStack gap="100">
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Revenue at Risk:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      ${(demandData.revenueImpact / 1000000).toFixed(2)}M
                                    </Text>
                                  </InlineStack>
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Units Affected:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      {demandData.unitImpact.toLocaleString()}
                                    </Text>
                                  </InlineStack>
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Coverage:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      {demandData.impactCoverage}%
                                    </Text>
                                  </InlineStack>
                                </BlockStack>
                              </BlockStack>
                            </Layout.Section>

                            <Layout.Section variant="oneHalf">
                              <BlockStack gap="200">
                                <Text variant="headingSm" as="h4">
                                  Recommended Action
                                </Text>
                                <BlockStack gap="100">
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Action Type:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      {demandData.predictedAction}
                                    </Text>
                                  </InlineStack>
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Priority:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      {demandData.actionPriority}
                                    </Text>
                                  </InlineStack>
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Due Date:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      {demandData.dueDate}
                                    </Text>
                                  </InlineStack>
                                </BlockStack>
                              </BlockStack>
                            </Layout.Section>
                          </Layout>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 1 && (
                  <Layout>
                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Projected Backorders vs Forecast
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            5-week demand projection and backorder accumulation
                          </Text>
                          <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={forecastData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="week" />
                                <YAxis />
                                <Line
                                  type="monotone"
                                  dataKey="projected"
                                  stroke="#3b82f6"
                                  strokeWidth={2}
                                  name="Projected Demand"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="actual"
                                  stroke="#10b981"
                                  strokeWidth={2}
                                  name="Actual Inventory"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="backorder"
                                  stroke="#ef4444"
                                  strokeWidth={2}
                                  name="Backorders"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                          <Layout>
                            <Layout.Section variant="oneThird">
                              <Box textAlign="center">
                                <Text as="p" variant="bodySm" tone="info">
                                  Projected Demand
                                </Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  21,200
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  5-week total
                                </Text>
                              </Box>
                            </Layout.Section>
                            <Layout.Section variant="oneThird">
                              <Box textAlign="center">
                                <Text as="p" variant="bodySm" tone="success">
                                  Available Inventory
                                </Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  14,700
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  current + pipeline
                                </Text>
                              </Box>
                            </Layout.Section>
                            <Layout.Section variant="oneThird">
                              <Box textAlign="center">
                                <Text as="p" variant="bodySm" tone="critical">
                                  Projected Backorders
                                </Text>
                                <Text as="p" variant="headingLg" fontWeight="bold">
                                  6,500
                                </Text>
                                <Text as="p" variant="bodySm" tone="subdued">
                                  units short
                                </Text>
                              </Box>
                            </Layout.Section>
                          </Layout>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Projected Inventory Levels
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Inventory projection with and without intervention
                          </Text>

                          <Banner tone="critical" title="Without Action">
                            <Layout>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm">
                                    Stock Depletion: <strong>Week 3</strong>
                                  </Text>
                                  <Text as="p" variant="bodySm">
                                    Revenue Loss: <strong>${(demandData.revenueImpact / 1000000).toFixed(2)}M</strong>
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm">
                                    Max Backorders: <strong>8,200 units</strong>
                                  </Text>
                                  <Text as="p" variant="bodySm">
                                    Recovery Time: <strong>6-8 weeks</strong>
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                            </Layout>
                          </Banner>

                          <Banner tone="success" title="With Recommended Action">
                            <Layout>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm">
                                    Stock Stabilization: <strong>Week 2</strong>
                                  </Text>
                                  <Text as="p" variant="bodySm">
                                    Revenue Protected:{" "}
                                    <strong>${((demandData.revenueImpact * 0.75) / 1000000).toFixed(2)}M</strong>
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm">
                                    Reduced Backorders: <strong>2,100 units</strong>
                                  </Text>
                                  <Text as="p" variant="bodySm">
                                    Recovery Time: <strong>2-3 weeks</strong>
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                            </Layout>
                          </Banner>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 2 && (
                  <Card>
                    <BlockStack gap="400">
                      <Text variant="headingMd" as="h3">
                        Inventory Availability Across Locations
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Current stock levels and allocation status
                      </Text>
                      {inventoryData.map((location, index) => (
                        <Card key={index} background="bg-surface-secondary">
                          <BlockStack gap="300">
                            <InlineStack align="space-between">
                              <Text variant="headingSm" as="h4" fontWeight="medium">
                                {location.location}
                              </Text>
                              <Badge tone="info">
                                {((location.available / (location.available + location.allocated)) * 100).toFixed(0)}%
                                Available
                              </Badge>
                            </InlineStack>
                            <Layout>
                              <Layout.Section variant="oneThird">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Available
                                  </Text>
                                  <Text as="p" variant="headingMd" fontWeight="bold" tone="success">
                                    {location.available.toLocaleString()}
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                              <Layout.Section variant="oneThird">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    Allocated
                                  </Text>
                                  <Text as="p" variant="headingMd" fontWeight="bold">
                                    {location.allocated.toLocaleString()}
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                              <Layout.Section variant="oneThird">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    In Transit
                                  </Text>
                                  <Text as="p" variant="headingMd" fontWeight="bold" tone="warning">
                                    {location.transit.toLocaleString()}
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                            </Layout>
                            <div
                              style={{
                                display: "flex",
                                backgroundColor: "#e5e7eb",
                                borderRadius: "9999px",
                                height: "8px",
                              }}
                            >
                              <div
                                style={{
                                  backgroundColor: "#10b981",
                                  borderTopLeftRadius: "9999px",
                                  borderBottomLeftRadius: "9999px",
                                  height: "8px",
                                  width: `${(location.available / (location.available + location.allocated + location.transit)) * 100}%`,
                                }}
                              />
                              <div
                                style={{
                                  backgroundColor: "#3b82f6",
                                  height: "8px",
                                  width: `${(location.allocated / (location.available + location.allocated + location.transit)) * 100}%`,
                                }}
                              />
                              <div
                                style={{
                                  backgroundColor: "#f97316",
                                  borderTopRightRadius: "9999px",
                                  borderBottomRightRadius: "9999px",
                                  height: "8px",
                                  width: `${(location.transit / (location.available + location.allocated + location.transit)) * 100}%`,
                                }}
                              />
                            </div>
                          </BlockStack>
                        </Card>
                      ))}
                    </BlockStack>
                  </Card>
                )}

                {selectedTab === 3 && (
                  <Layout>
                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Implementation Impact Analysis
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Expected outcomes of executing the recommended action
                          </Text>
                          <Layout>
                            <Layout.Section variant="oneHalf">
                              <Card background="bg-surface-info">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" fontWeight="medium">
                                    Operational Impact
                                  </Text>
                                  <Text as="p" variant="headingLg" fontWeight="bold">
                                    +75%
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    fulfillment improvement
                                  </Text>
                                </BlockStack>
                              </Card>
                            </Layout.Section>
                            <Layout.Section variant="oneHalf">
                              <Card background="bg-surface-success">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" fontWeight="medium">
                                    Revenue Protection
                                  </Text>
                                  <Text as="p" variant="headingLg" fontWeight="bold">
                                    $3.2M
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    revenue secured
                                  </Text>
                                </BlockStack>
                              </Card>
                            </Layout.Section>
                          </Layout>
                          <Layout>
                            <Layout.Section variant="oneHalf">
                              <Card background="bg-surface-warning">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" fontWeight="medium">
                                    Customer Impact
                                  </Text>
                                  <Text as="p" variant="headingLg" fontWeight="bold">
                                    -60%
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    backorder reduction
                                  </Text>
                                </BlockStack>
                              </Card>
                            </Layout.Section>
                            <Layout.Section variant="oneHalf">
                              <Card background="bg-surface-secondary">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodySm" fontWeight="medium">
                                    Lead Time
                                  </Text>
                                  <Text as="p" variant="headingLg" fontWeight="bold">
                                    {demandData.transferLeadTime}
                                  </Text>
                                  <Text as="p" variant="bodySm" tone="subdued">
                                    to implementation
                                  </Text>
                                </BlockStack>
                              </Card>
                            </Layout.Section>
                          </Layout>

                          <BlockStack gap="200">
                            <Text variant="headingSm" as="h4">
                              Key Benefits
                            </Text>
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm">
                                • Immediate reduction in projected backorders
                              </Text>
                              <Text as="p" variant="bodySm">
                                • Improved customer satisfaction and retention
                              </Text>
                              <Text as="p" variant="bodySm">
                                • Optimized inventory distribution across regions
                              </Text>
                              <Text as="p" variant="bodySm">
                                • Enhanced supply chain resilience
                              </Text>
                            </BlockStack>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Risk Assessment
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Potential risks and mitigation strategies
                          </Text>

                          <Banner tone="warning" title="Medium Risk">
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm">
                                Transportation delays due to weather
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Mitigation: Alternative routing options available
                              </Text>
                            </BlockStack>
                          </Banner>

                          <Banner tone="warning" title="Medium Risk">
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm">
                                Source location stock depletion
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Mitigation: Maintain 20% safety stock buffer
                              </Text>
                            </BlockStack>
                          </Banner>

                          <Banner tone="success" title="Low Risk">
                            <BlockStack gap="100">
                              <Text as="p" variant="bodySm">
                                Demand forecast accuracy
                              </Text>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Confidence level: {demandData.confidenceLevel.toFixed(1)}%
                              </Text>
                            </BlockStack>
                          </Banner>

                          <Card background="bg-surface-secondary">
                            <BlockStack gap="200">
                              <Text variant="headingSm" as="h4">
                                Success Metrics
                              </Text>
                              <BlockStack gap="100">
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm">
                                    Backorder Reduction Target:
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="medium">
                                    60%
                                  </Text>
                                </InlineStack>
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm">
                                    On-Time Delivery Target:
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="medium">
                                    95%
                                  </Text>
                                </InlineStack>
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm">
                                    Customer Satisfaction:
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="medium">
                                    4.5/5.0
                                  </Text>
                                </InlineStack>
                              </BlockStack>
                            </BlockStack>
                          </Card>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 4 && (
                  <Card>
                    <BlockStack gap="400">
                      <Text variant="headingMd" as="h3">
                        Alternative Recommendations
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Explore different approaches to address the demand imbalance
                      </Text>
                      <Layout>
                        {alternatives.map((option, index) => (
                          <Layout.Section key={index} variant="oneThird">
                            <Card background={index === 0 ? "bg-surface-info" : undefined}>
                              <BlockStack gap="300">
                                <InlineStack align="space-between">
                                  <Text variant="headingSm" as="h4">
                                    {option.title}
                                  </Text>
                                  {index === 0 && <Badge tone="success">Recommended</Badge>}
                                </InlineStack>
                                <Text as="p" variant="bodySm">
                                  {option.description}
                                </Text>
                                <BlockStack gap="100">
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Cost:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      {option.cost}
                                    </Text>
                                  </InlineStack>
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Lead Time:
                                    </Text>
                                    <Text as="span" variant="bodySm" fontWeight="medium">
                                      {option.leadTime}
                                    </Text>
                                  </InlineStack>
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Risk Level:
                                    </Text>
                                    <Badge
                                      tone={
                                        option.riskLevel === "Low"
                                          ? "info"
                                          : option.riskLevel === "Medium"
                                            ? "warning"
                                            : "critical"
                                      }
                                    >
                                      {option.riskLevel}
                                    </Badge>
                                  </InlineStack>
                                  <InlineStack align="space-between">
                                    <Text as="span" variant="bodySm" tone="subdued">
                                      Impact:
                                    </Text>
                                    <Badge
                                      tone={
                                        option.impact === "Very High"
                                          ? "success"
                                          : option.impact === "High"
                                            ? "info"
                                            : "warning"
                                      }
                                    >
                                      {option.impact}
                                    </Badge>
                                  </InlineStack>
                                </BlockStack>
                                <Button variant={index === 0 ? "primary" : "secondary"} size="slim">
                                  Select Option
                                </Button>
                              </BlockStack>
                            </Card>
                          </Layout.Section>
                        ))}
                      </Layout>
                    </BlockStack>
                  </Card>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Modals */}
      <Modal
        open={isExpediteModalActive}
        onClose={() => setIsExpediteModalActive(false)}
        title={isLowStock ? "Transfer Shipment?" : "Transfer Shipment?"}
        primaryAction={{
          content: "Confirm Shipment",
          onAction: () => setIsExpediteModalActive(false),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsExpediteModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Text as="p" variant="bodyMd">
              {isLowStock
                ? `Critical stock shortage detected. This will authorize transfer of 3,000 units via air freight. Estimated cost: $45,000. Delivery time: 24-48 hours.`
                : `Transfer shipment of 2,500 units via ground transport. Estimated cost: $8,500. Delivery time: 5-7 days.`}
            </Text>
            <Layout>
              <Layout.Section variant="oneHalf">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    Shipment Size
                  </Text>
                  <Text as="p" variant="headingMd">
                    {isLowStock ? "3,000" : "2,500"} units
                  </Text>
                </BlockStack>
              </Layout.Section>
              <Layout.Section variant="oneHalf">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    Total Cost
                  </Text>
                  <Text as="p" variant="headingMd">
                    {isLowStock ? "$45,000" : "$8,500"}
                  </Text>
                </BlockStack>
              </Layout.Section>
            </Layout>
            <Layout>
              <Layout.Section variant="oneHalf">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    Delivery Method
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {isLowStock ? "Air Freight" : "Ground Transport"}
                  </Text>
                </BlockStack>
              </Layout.Section>
              <Layout.Section variant="oneHalf">
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" fontWeight="medium">
                    ETA
                  </Text>
                  <Text as="p" variant="bodyMd">
                    {isLowStock ? "24-48 hours" : "5-7 days"}
                  </Text>
                </BlockStack>
              </Layout.Section>
            </Layout>
          </BlockStack>
        </Modal.Section>
      </Modal>

      <Modal
        open={isContactModalActive}
        onClose={() => setIsContactModalActive(false)}
        title={`Contact ${demandData.sourceLocation}`}
        primaryAction={{
          content: "Send Message",
          onAction: () => setIsContactModalActive(false),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsContactModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Text as="p" variant="bodyMd">
              Send urgent communication regarding inventory levels and restocking requirements.
            </Text>
            <Select
              label="Message Type"
              options={["Inventory Alert", "Restock Request", "Promotional Opportunity", "General Inquiry"]}
              onChange={() => {}}
              value=""
            />
            <Select
              label="Priority Level"
              options={[
                "High - Immediate Response Required",
                "Medium - Response within 24 hours",
                "Low - Response within 3 days",
              ]}
              onChange={() => {}}
              value=""
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={isForecastModalActive}
        onClose={() => setIsForecastModalActive(false)}
        title="Update Demand Forecast"
        primaryAction={{
          content: "Update Forecast",
          onAction: () => setIsForecastModalActive(false),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsForecastModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Text as="p" variant="bodyMd">
              Adjust demand projections based on current market conditions and sales trends.
            </Text>
            <BlockStack gap="100">
              <Text as="p" variant="bodySm" fontWeight="medium">
                Current Forecast
              </Text>
              <Text as="p" variant="headingMd">
                {demandData.projectedDemand.toLocaleString()} units
              </Text>
            </BlockStack>
            <TextField
              label="New Forecast"
              type="number"
              value={demandData.projectedDemand.toString()}
              onChange={() => {}}
              autoComplete="off"
            />
            <Select
              label="Adjustment Reason"
              options={[
                "Seasonal Demand Change",
                "Market Trend Shift",
                "Promotional Campaign",
                "Competitor Activity",
                "Supply Chain Disruption",
              ]}
              onChange={() => {}}
              value=""
            />
            <Select
              label="Confidence Level"
              options={["High (90-95%)", "Medium (75-89%)", "Low (60-74%)"]}
              onChange={() => {}}
              value=""
            />
          </FormLayout>
        </Modal.Section>
      </Modal>

      <Modal
        open={isReportModalActive}
        onClose={() => setIsReportModalActive(false)}
        title="Generate Supply Chain Report"
        primaryAction={{
          content: "Generate & Send",
          onAction: () => setIsReportModalActive(false),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsReportModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <Text as="p" variant="bodyMd">
              Create detailed analytics report for this product and distribution center.
            </Text>
            <Select
              label="Report Type"
              options={[
                "Inventory Analysis",
                "Sales Performance",
                "Demand Forecasting",
                "Supply Chain Efficiency",
                "Comprehensive Overview",
              ]}
              onChange={() => {}}
              value=""
            />
            <Select
              label="Time Period"
              options={["Last 7 days", "Last 30 days", "Last 90 days", "Last 6 months", "Last 12 months"]}
              onChange={() => {}}
              value=""
            />
            <TextField label="Recipients" type="email" value="" onChange={() => {}} autoComplete="off" />
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
