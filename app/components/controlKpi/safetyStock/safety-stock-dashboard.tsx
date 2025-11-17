import { useState } from "react"
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
} from "@shopify/polaris"
import {
  PackageIcon,
  AlertTriangleIcon,
  ClockIcon,
  ChartVerticalIcon,
  TargetIcon,
} from "@shopify/polaris-icons"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts"

interface SafetyStockData {
  id: string
  skuCode: string
  productName: string
  location: string
  currentSafetyStock: number
  recommendedSafetyStock: number
  safetyStockDays: number
  recommendedDays: number
  inventorySavings: number
  serviceRiskReduction: number
  co2Impact: number
  segment: string
  targetServiceLevel: number
  priority: string
  createdDate: string
  averageDemand: number
  demandVariation: number
  forecastError: number
  replenishmentLeadTime: number
  leadTimeVariability: number
  currentServiceLevel: number
}

interface SafetyStockDashboardProps {
  safetyStockData: SafetyStockData
}

export default function SafetyStockDashboard({ safetyStockData }: SafetyStockDashboardProps) {
  const [selectedTab, setSelectedTab] = useState(0)

  const reductionPercentage = ((safetyStockData.currentSafetyStock - safetyStockData.recommendedSafetyStock) / safetyStockData.currentSafetyStock * 100)
  const isHighPriority = safetyStockData.priority === "High"

  // Mock historical data for safety stock trend
  const safetyStockTrend = [
    { month: "Jan-24", current: 1650, recommended: 1350, actual: 1680 },
    { month: "Feb-24", current: 1700, recommended: 1370, actual: 1720 },
    { month: "Mar-24", current: 1720, recommended: 1380, actual: 1700 },
    { month: "Apr-24", current: 1730, recommended: 1390, actual: 1750 },
    { month: "May-24", current: 1740, recommended: 1395, actual: 1730 },
    { month: "Jun-24", current: 1750, recommended: 1400, actual: 1750 },
  ]

  // ABC/XYZ segmentation data
  const segmentationData = [
    { class: "A", x: 99, y: 96, z: 90 },
    { class: "B", x: 97, y: 94, z: 84 },
    { class: "C", x: 95, y: 92, z: 75 },
  ]

  // Lead time distribution
  const leadTimeData = [
    { day: 45, frequency: 150 },
    { day: 46, frequency: 180 },
    { day: 47, frequency: 250 },
    { day: 48, frequency: 200 },
    { day: 49, frequency: 170 },
    { day: 50, frequency: 120 },
    { day: 51, frequency: 80 },
    { day: 52, frequency: 50 },
    { day: 53, frequency: 30 },
    { day: 54, frequency: 20 },
  ]

  // Demand variability
  const demandVariabilityData = [
    { month: "Sep-23", forecasted: 15100, actual: 15300 },
    { month: "Oct-23", forecasted: 14900, actual: 14700 },
    { month: "Nov-23", forecasted: 16200, actual: 16500 },
    { month: "Dec-23", forecasted: 17100, actual: 16800 },
    { month: "Jan-24", forecasted: 15800, actual: 16000 },
    { month: "Feb-24", forecasted: 14500, actual: 14200 },
    { month: "Mar-24", forecasted: 15300, actual: 15600 },
    { month: "Apr-24", forecasted: 16000, actual: 15800 },
    { month: "May-24", forecasted: 15500, actual: 15700 },
    { month: "Jun-24", forecasted: 15000, actual: 14900 },
  ]

  // Alternative scenarios
  const alternatives = [
    {
      title: "Business Rules Grid",
      description: "Fixed safety stock based on segment rules",
      safetyStockDays: 27,
      targetServiceLevel: 94,
      inventorySavings: 184555.89,
      serviceRisk: 0,
      co2Impact: -20.60,
      feasible: "Yes",
    },
    {
      title: "King's Formula",
      description: "Statistical calculation using demand variability",
      safetyStockDays: 25,
      targetServiceLevel: 94,
      inventorySavings: 186600.93,
      serviceRisk: 0,
      co2Impact: -20.20,
      feasible: "Yes",
    },
    {
      title: "Monte Carlo Simulation",
      description: "Probabilistic approach with 10,000 simulations",
      safetyStockDays: 24,
      targetServiceLevel: 94,
      inventorySavings: 189625.97,
      serviceRisk: 0,
      co2Impact: -20.00,
      feasible: "Yes",
    },
  ]

  const tabs = [
    { id: "safety-stock", content: "Safety Stock", panelID: "safety-stock-panel" },
    { id: "segmentation", content: "Item Segmentation", panelID: "segmentation-panel" },
    { id: "supply-variability", content: "Supply Variability", panelID: "supply-variability-panel" },
    { id: "demand-variability", content: "Demand Variability", panelID: "demand-variability-panel" },
    { id: "alternatives", content: "Alternatives", panelID: "alternatives-panel" },
    { id: "learning", content: "Learning", panelID: "learning-panel" },
  ]

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
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
      title={`${safetyStockData.productName} (${safetyStockData.skuCode})`}
      subtitle={safetyStockData.location}
      backAction={{ content: "Back to Safety Stock Alerts", url: "/inv/safety-stock" }}
      titleMetadata={
        <InlineStack gap="200">
          {getPriorityBadge(safetyStockData.priority)}
          <Badge tone="info" >{`Segment ${safetyStockData.segment}`}</Badge>
          <Text as="span" variant="bodySm" tone="subdued">
            Created: {safetyStockData.createdDate}
          </Text>
        </InlineStack>
      }
    >
      <Layout>
        {/* Header Info */}
        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="p" variant="bodyMd">
                Reduce Safety Stock for {safetyStockData.productName} in {safetyStockData.location} from{" "}
                {safetyStockData.safetyStockDays} to {safetyStockData.recommendedDays} days.
              </Text>
              <InlineStack gap="600">
                <BlockStack gap="100">
                  <Text as="p" variant="headingLg" fontWeight="bold">
                    ${(safetyStockData.inventorySavings / 1000).toFixed(1)}K
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Inventory Savings
                  </Text>
                </BlockStack>
                <BlockStack gap="100">
                  <Text as="p" variant="headingLg" fontWeight="bold">
                    ${safetyStockData.serviceRiskReduction}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Service Risk Reduction
                  </Text>
                </BlockStack>
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
                      Current Safety Stock
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <PackageIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {safetyStockData.currentSafetyStock.toLocaleString()} units
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    {safetyStockData.safetyStockDays} days
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Recommended Safety Stock
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <TargetIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold" tone="success">
                    {safetyStockData.recommendedSafetyStock.toLocaleString()} units
                  </Text>
                  <ProgressBar progress={100 - reductionPercentage} size="small" tone="success" />
                  <Text as="p" variant="bodySm" tone="subdued">
                    {safetyStockData.recommendedDays} days ({reductionPercentage.toFixed(1)}% reduction)
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Target Service Level
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <ChartVerticalIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {safetyStockData.targetServiceLevel}%
                  </Text>
                  <ProgressBar progress={safetyStockData.targetServiceLevel} size="small" tone="success" />
                  <Text as="p" variant="bodySm" tone="subdued">
                    Maintained after optimization
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      CO2 Impact
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <AlertTriangleIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold" tone="critical">
                    {safetyStockData.co2Impact} kgCO2e
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Environmental benefit
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
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Safety Stock Analysis
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Based on expected demand, supply volatility, and service level target of {safetyStockData.targetServiceLevel}%,
                      we recommend holding a safety stock of {safetyStockData.recommendedDays} days.
                    </Text>

                    <div style={{ height: "350px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={safetyStockTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="current" stroke="#8884d8" strokeWidth={2} name="Current Safety Stock" />
                          <Line type="monotone" dataKey="recommended" stroke="#10b981" strokeWidth={2} name="Recommended" />
                          <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Actual Stock" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <Layout>
                      <Layout.Section variant="oneHalf">
                        <Card background="bg-surface-secondary">
                          <BlockStack gap="200">
                            <Text variant="headingSm" as="h4">
                              Current State
                            </Text>
                            <BlockStack gap="100">
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Safety Stock (Units):
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {safetyStockData.currentSafetyStock.toLocaleString()}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Safety Stock (Days):
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {safetyStockData.safetyStockDays}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Service Level:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {safetyStockData.currentServiceLevel}%
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section variant="oneHalf">
                        <Card background="bg-surface-success">
                          <BlockStack gap="200">
                            <Text variant="headingSm" as="h4">
                              Recommended State
                            </Text>
                            <BlockStack gap="100">
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm">
                                  Safety Stock (Units):
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="bold">
                                  {safetyStockData.recommendedSafetyStock.toLocaleString()}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm">
                                  Safety Stock (Days):
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="bold">
                                  {safetyStockData.recommendedDays}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm">
                                  Service Level:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="bold">
                                  {safetyStockData.targetServiceLevel}%
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>

                    <InlineStack gap="200">
                      <Button variant="primary" size="large">
                        Accept
                      </Button>
                      <Button size="large">
                        Modify
                      </Button>
                      <Button tone="critical" size="large">
                        Dismiss
                      </Button>
                    </InlineStack>
                  </BlockStack>
                )}

                {selectedTab === 1 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Item Segmentation (ABC/XYZ Analysis)
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      The {safetyStockData.productName} is currently in segment {safetyStockData.segment} with a target service level of {safetyStockData.targetServiceLevel}%.
                    </Text>

                    <Layout>
                      <Layout.Section variant="oneHalf">
                        <Card>
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Target Service Level By Class
                            </Text>
                            <div style={{ height: "250px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                  <tr>
                                    <th style={{ padding: "12px", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}></th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>X</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Y</th>
                                    <th style={{ padding: "12px", textAlign: "center", borderBottom: "1px solid #e5e7eb" }}>Z</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {segmentationData.map((row, idx) => (
                                    <tr key={idx}>
                                      <td style={{ padding: "12px", fontWeight: "600" }}>{row.class}</td>
                                      <td style={{ padding: "12px", textAlign: "center" }}>{row.x}%</td>
                                      <td style={{ padding: "12px", textAlign: "center", backgroundColor: safetyStockData.segment === `${row.class}/Y` ? "#dbeafe" : "transparent", fontWeight: safetyStockData.segment === `${row.class}/Y` ? "600" : "normal" }}>{row.y}%</td>
                                      <td style={{ padding: "12px", textAlign: "center" }}>{row.z}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section variant="oneHalf">
                        <Card>
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Classification Distribution
                            </Text>
                            <div style={{ height: "250px", display: "flex", alignItems: "center" }}>
                              <div style={{ width: "100%" }}>
                                <div style={{ marginBottom: "20px" }}>
                                  <InlineStack align="space-between" blockAlign="center">
                                    <Text as="span" variant="bodySm">A</Text>
                                    <Text as="span" variant="bodySm">10%</Text>
                                  </InlineStack>
                                  <ProgressBar progress={10} size="medium" />
                                </div>
                                <div style={{ marginBottom: "20px" }}>
                                  <InlineStack align="space-between" blockAlign="center">
                                    <Text as="span" variant="bodySm">B (Current)</Text>
                                    <Text as="span" variant="bodySm" fontWeight="bold">30%</Text>
                                  </InlineStack>
                                  <ProgressBar progress={30} size="medium" tone="success" />
                                </div>
                                <div>
                                  <InlineStack align="space-between" blockAlign="center">
                                    <Text as="span" variant="bodySm">C</Text>
                                    <Text as="span" variant="bodySm">30%</Text>
                                  </InlineStack>
                                  <ProgressBar progress={30} size="medium" />
                                </div>
                              </div>
                            </div>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>

                    <Card background="bg-surface-secondary">
                      <BlockStack gap="200">
                        <Text variant="headingSm" as="h4">
                          SKU Insights
                        </Text>
                        <Text variant="bodySm" as="p">
                          This product belongs to segment B (Medium Value) - Y with a target service level of 94%.
                          ABC classification is based on revenue contribution, while XYZ is based on demand variability.
                        </Text>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {selectedTab === 2 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Supply Variability
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Replenishment lead times for {safetyStockData.productName} are {safetyStockData.replenishmentLeadTime} days on average,
                      with a {safetyStockData.leadTimeVariability}% variability range.
                    </Text>

                    <Layout>
                      <Layout.Section variant="oneThird">
                        <Card>
                          <BlockStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Average Lead Time in Days
                            </Text>
                            <Text variant="heading2xl" fontWeight="bold" as="h4">
                              {safetyStockData.replenishmentLeadTime}
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Average number of days it takes for a customer to receive a product after they order it.
                            </Text>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section variant="oneThird">
                        <Card>
                          <BlockStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Variability Range (%)
                            </Text>
                            <Text variant="heading2xl" fontWeight="bold" as="h4">
                              {safetyStockData.leadTimeVariability}%
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Percentage variation, considering minimum and maximum lead time.
                            </Text>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section variant="oneThird">
                        <Card>
                          <BlockStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Probability (%)
                            </Text>
                            <Text variant="heading2xl" fontWeight="bold" as="h4">
                              96%
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Probability of a customer receiving a product considering the lead time.
                            </Text>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>

                    <Card>
                      <BlockStack gap="300">
                        <Text variant="headingSm" as="h4">
                          Lead Time Distribution
                        </Text>
                        <div style={{ height: "300px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={leadTimeData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="day" label={{ value: "Transfer Time Between DCs", position: "insideBottom", offset: -5 }} />
                              <YAxis label={{ value: "Frequency", angle: -90, position: "insideLeft" }} />
                              <Tooltip />
                              <Bar dataKey="frequency" fill="#06b6d4" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {selectedTab === 3 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Demand Variability
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Demand variation for {safetyStockData.productName} over the last 27 months is {safetyStockData.demandVariation.toLocaleString()} units.
                    </Text>

                    <Layout>
                      <Layout.Section variant="oneThird">
                        <Card>
                          <BlockStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Average Demand Forecasted (Units)
                            </Text>
                            <Text variant="heading2xl" fontWeight="bold" as="h4">
                              {safetyStockData.averageDemand.toLocaleString()}
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Monthly average estimations in relation to customer demand.
                            </Text>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section variant="oneThird">
                        <Card>
                          <BlockStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Average Demand Variation (Units)
                            </Text>
                            <Text variant="heading2xl" fontWeight="bold" as="h4">
                              {safetyStockData.demandVariation.toLocaleString()}
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Monthly average variation in customer demand.
                            </Text>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section variant="oneThird">
                        <Card>
                          <BlockStack gap="200">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Average Forecast Error %
                            </Text>
                            <Text variant="heading2xl" fontWeight="bold" as="h4">
                              {safetyStockData.forecastError}%
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Percentage average deviation of the actual demand from the forecasted demand.
                            </Text>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>

                    <Card>
                      <BlockStack gap="300">
                        <Text variant="headingSm" as="h4">
                          Demand Variation History
                        </Text>
                        <div style={{ height: "350px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demandVariabilityData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="forecasted" fill="#93c5fd" name="Forecasted Units" />
                              <Bar dataKey="actual" fill="#3b82f6" name="Actual Units" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {selectedTab === 4 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Alternative Recommendations
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Explore different calculation methods for safety stock optimization
                    </Text>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                        <thead>
                          <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                            <th style={{ padding: "12px", textAlign: "left" }}>Alternative</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Safety Stock (Days)</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Target Service Level</th>
                            <th style={{ padding: "12px", textAlign: "right" }}>Inventory Savings</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Service Risk Reduction</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>CO2 Impact (kgCO2e)</th>
                            <th style={{ padding: "12px", textAlign: "center" }}>Feasibility</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alternatives.map((alt, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                              <td style={{ padding: "12px" }}>
                                <BlockStack gap="100">
                                  <Text variant="bodySm" fontWeight="semibold" as="p">{alt.title}</Text>
                                  <Text variant="bodySm" tone="subdued" as="p">{alt.description}</Text>
                                </BlockStack>
                              </td>
                              <td style={{ padding: "12px", textAlign: "center" }}>{alt.safetyStockDays}</td>
                              <td style={{ padding: "12px", textAlign: "center" }}>{alt.targetServiceLevel}%</td>
                              <td style={{ padding: "12px", textAlign: "right" }}>${alt.inventorySavings.toLocaleString()}</td>
                              <td style={{ padding: "12px", textAlign: "center" }}>{alt.serviceRisk}</td>
                              <td style={{ padding: "12px", textAlign: "center" }}>{alt.co2Impact}</td>
                              <td style={{ padding: "12px", textAlign: "center" }}>
                                <Badge tone="success">{alt.feasible}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <InlineStack gap="200">
                      <Button variant="primary">Confirm Alternatives</Button>
                    </InlineStack>
                  </BlockStack>
                )}

                {selectedTab === 5 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Learning & Confidence Analysis
                    </Text>

                    <Layout>
                      <Layout.Section variant="oneHalf">
                        <Card>
                          <BlockStack gap="300">
                            <InlineStack align="space-between">
                              <Text variant="headingSm" as="h4">
                                Confidence Score Contributors
                              </Text>
                              <Text variant="headingLg" fontWeight="bold" as="h4">
                                79.04%
                              </Text>
                            </InlineStack>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Value Achievement Probability If Accepted
                            </Text>
                            <div style={{ height: "250px" }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  layout="vertical"
                                  data={[
                                    { factor: "Business Case", value: 0.0943 },
                                    { factor: "Segmentation", value: 0.1258 },
                                    { factor: "Actual Service Level", value: -0.2096 },
                                    { factor: "Demand Variability", value: -0.1153 },
                                    { factor: "Supply Variability", value: 0.1467 },
                                    { factor: "Total Lead Time", value: 0.1677 },
                                    { factor: "N Attain %", value: 0.2096 },
                                  ]}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis type="number" domain={[-0.3, 0.3]} />
                                  <YAxis type="category" dataKey="factor" width={150} />
                                  <Tooltip />
                                  <Bar
                                    dataKey="value"
                                    fill="#06b6d4"
                                    >
                                    {
                                      // Use bar color dynamically by providing a function to the fill prop at the <Cell> level.
                                      [
                                        { factor: "Business Case", value: 0.0943 },
                                        { factor: "Segmentation", value: 0.1258 },
                                        { factor: "Actual Service Level", value: -0.2096 },
                                        { factor: "Demand Variability", value: -0.1153 },
                                        { factor: "Supply Variability", value: 0.1467 },
                                        { factor: "Total Lead Time", value: 0.1677 },
                                        { factor: "N Attain %", value: 0.2096 },
                                      ].map((entry, index) => (
                                        <Cell
                                          key={`cell-${index}`}
                                          fill={entry.value > 0 ? "#22c55e" : "#ef4444"}
                                        />
                                      ))}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </BlockStack>
                          </Card>
                        </Layout.Section>

                        <Layout.Section variant="oneHalf">
                          <Card>
                            <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Decision Taken Summary
                            </Text>
                            <Layout>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="200">
                                  <Text variant="bodySm" tone="subdued" as="p">
                                    Total Recommendations
                                  </Text>
                                  <Text variant="headingXl" fontWeight="bold" as="h4">
                                    7,000
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="200">
                                  <Text variant="bodySm" tone="subdued" as="p">
                                    Action Trends
                                  </Text>
                                  <Text variant="headingXl" fontWeight="bold" as="h4">
                                    Accepted
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                            </Layout>
                            <Banner tone="info">
                              <Text variant="bodySm" as="p">
                                Based on historical acceptance patterns and business rules, this recommendation has a high
                                probability of achieving the expected inventory savings and service level targets.
                              </Text>
                            </Banner>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>

                    <Card>
                      <BlockStack gap="200">
                        <Text variant="headingSm" as="h4">
                          Process Flow
                        </Text>
                        <InlineStack gap="200">
                          <Button>Process Flow</Button>
                          <Button>Open Report</Button>
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
