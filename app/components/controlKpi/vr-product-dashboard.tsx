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
  ProgressBar,
  Modal,
  FormLayout,
  TextField,
  Select,
  Banner,
} from "@shopify/polaris"
import {
  PackageIcon,
  ChartVerticalIcon,
  CalendarIcon,
  CashDollarIcon,
  DeliveryIcon,
  PersonIcon,
  AlertTriangleIcon,
} from "@shopify/polaris-icons"

interface ProductData {
  distributionCenter: string
  productModel: string
  sku: string
  currentStock: number
  forecastDemand: number
  retailPartner: string
  region: string
  alertType: string
  daysOfInventory: number
  lastShipment: string
  nextShipment: string
  salesVelocity: string
  retailPrice: string
  priority: string
}

interface VRProductDashboardProps {
  productData: ProductData
}

export default function VRProductDashboard({ productData }: VRProductDashboardProps) {
  const stockPercentage = (productData.currentStock / productData.forecastDemand) * 100
  const isLowStock = productData.priority === "high" || productData.priority === "critical"

  const [selectedTab, setSelectedTab] = useState(0)
  const [isExpediteModalActive, setIsExpediteModalActive] = useState(false)
  const [isContactModalActive, setIsContactModalActive] = useState(false)
  const [isForecastModalActive, setIsForecastModalActive] = useState(false)
  const [isReportModalActive, setIsReportModalActive] = useState(false)

  // Mock additional data for dashboard
  const weeklyData = [
    { week: "Week 1", sales: 1200, returns: 45 },
    { week: "Week 2", sales: 1450, returns: 32 },
    { week: "Week 3", sales: 1680, returns: 28 },
    { week: "Week 4", sales: 1520, returns: 41 },
  ]

  const regionalBreakdown = [
    { store: "Best Buy - Los Angeles", stock: 450, sales: 89 },
    { store: "Best Buy - San Francisco", stock: 320, sales: 76 },
    { store: "Best Buy - San Diego", stock: 280, sales: 65 },
    { store: "Best Buy - Sacramento", stock: 190, sales: 43 },
  ]

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return <Badge tone="critical">Critical</Badge>
      case "high":
        return <Badge tone="warning">High</Badge>
      case "low":
        return <Badge tone="info">Low</Badge>
      default:
        return <Badge tone="success">Normal</Badge>
    }
  }

  const tabs = [
    { id: "overview", content: "Overview", panelID: "overview-panel" },
    { id: "inventory", content: "Inventory Flow", panelID: "inventory-panel" },
    { id: "retail", content: "Retail Performance", panelID: "retail-panel" },
    { id: "logistics", content: "Logistics", panelID: "logistics-panel" },
  ]

  return (
    <Page
      fullWidth
      title={productData.productModel}
      subtitle={`${productData.distributionCenter} • SKU: ${productData.sku} • ${productData.region}`}
      backAction={{ content: "Back to Finished Goods", url: "/inv/finishGoods" }}
      titleMetadata={
        <InlineStack gap="200">
          {getPriorityBadge(productData.priority)}
          <Badge tone="info">{productData.alertType}</Badge>
          <Text as="span" variant="bodySm" tone="subdued">
            Last updated: 2 hours ago
          </Text>
        </InlineStack>
      }
      primaryAction={{
        content: `${productData.currentStock.toLocaleString()} Units Available`,
        disabled: true,
      }}
    >
      <Layout>
        {/* Key Metrics Grid */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Stock vs Forecast
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <PackageIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {stockPercentage.toFixed(2)}%
                  </Text>
                  <ProgressBar progress={Number(stockPercentage.toFixed(2))} size="small" />
                  <Text as="p" variant="bodySm" tone="subdued">
                    {productData.currentStock.toLocaleString()} / {productData.forecastDemand.toLocaleString()} forecasted
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Sales Velocity
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <ChartVerticalIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold" tone="success">
                    {productData.salesVelocity}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    vs previous month
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    ~{Math.round(productData.currentStock / productData.daysOfInventory)} units/day
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Days of Inventory
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <CalendarIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {productData.daysOfInventory}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    days remaining
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="medium">
                    {productData.daysOfInventory < 20 ? "⚠️ Low coverage" : "✅ Good coverage"}
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="250px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Retail Price
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <CashDollarIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {productData.retailPrice}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Current MSRP
                  </Text>
                  <Text as="p" variant="bodyMd" fontWeight="medium" tone="success">
                    +2.1% margin
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
                    {/* Stock Trend Chart */}
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <InlineStack align="space-between">
                            <Text variant="headingMd" as="h3">
                              4-Week Stock & Sales Trend
                            </Text>
                            <div style={{ width: '16px', height: '16px' }}>
                              <ChartVerticalIcon />
                            </div>
                          </InlineStack>

                          {/* Chart visualization using stacked bars */}
                          <BlockStack gap="300">
                            {weeklyData.map((week, index) => {
                              const maxSales = Math.max(...weeklyData.map(w => w.sales))
                              const salesPercentage = (week.sales / maxSales) * 100
                              const returnPercentage = (week.returns / week.sales) * 100

                              return (
                                <BlockStack key={index} gap="100">
                                  <InlineStack align="space-between">
                                    <Text variant="bodySm" fontWeight="medium" as="span">
                                      {week.week}
                                    </Text>
                                    <InlineStack gap="300">
                                      <Text variant="bodySm" as="span">
                                        Sales: {week.sales}
                                      </Text>
                                      <Text variant="bodySm" tone="subdued" as="span">
                                        Returns: {week.returns}
                                      </Text>
                                    </InlineStack>
                                  </InlineStack>
                                  <ProgressBar
                                    progress={salesPercentage}
                                    size="medium"
                                    tone={salesPercentage > 80 ? "success" : "critical"}
                                  />
                                  <Text variant="bodySm" tone="subdued" as="p">
                                    Return rate: {returnPercentage.toFixed(1)}%
                                  </Text>
                                </BlockStack>
                              )
                            })}
                          </BlockStack>

                          <Banner tone="info">
                            <Text as="p" variant="bodySm">
                              Average weekly sales: {Math.round(weeklyData.reduce((sum, w) => sum + w.sales, 0) / weeklyData.length).toLocaleString()} units
                            </Text>
                          </Banner>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    {/* Forecast Analysis Chart */}
                    <Layout.Section>
                      <Card>
                        <BlockStack gap="400">
                          <InlineStack align="space-between">
                            <Text variant="headingMd" as="h3">
                              Forecast vs Actual Analysis
                            </Text>
                            <div style={{ width: '16px', height: '16px' }}>
                              <PackageIcon />
                            </div>
                          </InlineStack>

                          <BlockStack gap="300">
                            {/* Current Stock */}
                            <BlockStack gap="100">
                              <InlineStack align="space-between">
                                <Text variant="bodyMd" fontWeight="medium" as="span">
                                  Current Stock
                                </Text>
                                <Text variant="bodyMd" fontWeight="bold" as="span">
                                  {productData.currentStock.toLocaleString()} units
                                </Text>
                              </InlineStack>
                              <ProgressBar
                                progress={stockPercentage}
                                size="medium"
                                tone={stockPercentage >= 100 ? "success" : "critical"}
                              />
                            </BlockStack>

                            {/* Forecast Demand */}
                            <BlockStack gap="100">
                              <InlineStack align="space-between">
                                <Text variant="bodyMd" fontWeight="medium" as="span">
                                  Forecast Demand
                                </Text>
                                <Text variant="bodyMd" fontWeight="bold" as="span">
                                  {productData.forecastDemand.toLocaleString()} units
                                </Text>
                              </InlineStack>
                              <ProgressBar progress={100} size="medium" tone="success" />
                            </BlockStack>

                            {/* Gap Analysis */}
                            <BlockStack gap="100">
                              <InlineStack align="space-between">
                                <Text variant="bodyMd" fontWeight="medium" as="span">
                                  {stockPercentage >= 100 ? "Surplus" : "Deficit"}
                                </Text>
                                <Text
                                  variant="bodyMd"
                                  fontWeight="bold"
                                  tone={stockPercentage >= 100 ? "success" : "critical"}
                                  as="span"
                                >
                                  {Math.abs(productData.currentStock - productData.forecastDemand).toLocaleString()} units
                                </Text>
                              </InlineStack>
                              <ProgressBar
                                progress={Math.min(Math.abs(stockPercentage - 100), 100)}
                                size="small"
                                tone={stockPercentage >= 100 ? "success" : "critical"}
                              />
                            </BlockStack>
                          </BlockStack>

                          <Banner tone={stockPercentage >= 100 ? "success" : stockPercentage >= 70 ? "warning" : "critical"}>
                            <Text as="p" variant="bodySm">
                              {stockPercentage >= 100
                                ? `Inventory levels are healthy. You have ${(stockPercentage - 100).toFixed(1)}% surplus stock.`
                                : stockPercentage >= 70
                                ? `Stock coverage at ${stockPercentage.toFixed(1)}%. Consider reordering to meet forecast demand.`
                                : `Critical shortage! Only ${stockPercentage.toFixed(1)}% of forecast demand covered.`
                              }
                            </Text>
                          </Banner>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

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
                            {isLowStock ? "Expedite Shipment" : "Schedule Shipment"}
                          </Button>
                          <Button onClick={() => setIsContactModalActive(true)} icon={PersonIcon}>
                            Contact {productData.retailPartner}
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
                          <Text variant="headingMd" as="h3">
                            Recent Activity
                          </Text>
                          <BlockStack gap="300">
                            <Banner tone="info" title="Shipment received from manufacturing">
                              <Text as="p" variant="bodyMd">
                                2,500 units • {productData.lastShipment}
                              </Text>
                            </Banner>
                            <Banner tone="success" title={`Distributed to ${productData.retailPartner}`}>
                              <Text as="p" variant="bodyMd">
                                1,200 units • Jan 13, 2025
                              </Text>
                            </Banner>
                            <Banner tone="warning" title="Low stock alert triggered">
                              <Text as="p" variant="bodyMd">
                                Below reorder threshold • Jan 12, 2025
                              </Text>
                            </Banner>
                          </BlockStack>
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
                            Inbound Shipments
                          </Text>
                          <BlockStack gap="200">
                            <Card background="bg-surface-secondary">
                              <InlineStack align="space-between">
                                <BlockStack gap="100">
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    Manufacturing → Distribution Center
                                  </Text>
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    3,000 units expected
                                  </Text>
                                </BlockStack>
                                <BlockStack gap="100" align="end">
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    {productData.nextShipment}
                                  </Text>
                                  <Badge tone="info">In Transit</Badge>
                                </BlockStack>
                              </InlineStack>
                            </Card>
                            <Card background="bg-surface-secondary">
                              <InlineStack align="space-between">
                                <BlockStack gap="100">
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    Emergency Restock
                                  </Text>
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    1,500 units planned
                                  </Text>
                                </BlockStack>
                                <BlockStack gap="100" align="end">
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    Jan 25, 2025
                                  </Text>
                                  <Badge>Scheduled</Badge>
                                </BlockStack>
                              </InlineStack>
                            </Card>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Outbound Distribution
                          </Text>
                          <BlockStack gap="200">
                            {regionalBreakdown.map((store, index) => (
                              <Card key={index} background="bg-surface-secondary">
                                <InlineStack align="space-between">
                                  <BlockStack gap="100">
                                    <Text variant="bodyMd" fontWeight="medium" as="span">
                                      {store.store}
                                    </Text>
                                    <Text variant="bodySm" tone="subdued" as="span">
                                      {store.stock} units in stock
                                    </Text>
                                  </BlockStack>
                                  <BlockStack gap="100" align="end">
                                    <Text variant="bodyMd" fontWeight="medium" as="span">
                                      {store.sales} sold/week
                                    </Text>
                                    <Text variant="bodySm" tone="subdued" as="span">
                                      {Math.round(store.stock / store.sales)} weeks left
                                    </Text>
                                  </BlockStack>
                                </InlineStack>
                              </Card>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 2 && (
                  <Layout>
                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Weekly Sales Performance
                          </Text>
                          <BlockStack gap="200">
                            {weeklyData.map((week, index) => (
                              <Card key={index} background="bg-surface-secondary">
                                <InlineStack align="space-between">
                                  <BlockStack gap="100">
                                    <Text variant="bodyMd" fontWeight="medium" as="span">
                                      {week.week}
                                    </Text>
                                    <Text variant="bodySm" tone="subdued" as="span">
                                      {week.returns} returns
                                    </Text>
                                  </BlockStack>
                                  <BlockStack gap="100" align="end">
                                    <Text variant="bodyMd" fontWeight="medium" as="span">
                                      {week.sales} units sold
                                    </Text>
                                    <Text variant="bodySm" tone="success" as="span">
                                      {index > 0
                                        ? `+${(((week.sales - weeklyData[index - 1].sales) / weeklyData[index - 1].sales) * 100).toFixed(1)}%`
                                        : "Baseline"}
                                    </Text>
                                  </BlockStack>
                                </InlineStack>
                              </Card>
                            ))}
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Retail Partner Details
                          </Text>
                          <BlockStack gap="200">
                            <InlineStack gap="300">
                              <div style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#E3F2FD',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <PersonIcon />
                              </div>
                              <BlockStack gap="050">
                                <Text variant="bodyMd" fontWeight="medium" as="span">
                                  {productData.retailPartner}
                                </Text>
                                <Text variant="bodySm" tone="subdued" as="span">
                                  Primary retail partner
                                </Text>
                              </BlockStack>
                            </InlineStack>
                            <Layout>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    Contract Terms
                                  </Text>
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    Net 30
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    Margin
                                  </Text>
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    22%
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                            </Layout>
                            <Layout>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    Min Order
                                  </Text>
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    500 units
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                              <Layout.Section variant="oneHalf">
                                <BlockStack gap="100">
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    Lead Time
                                  </Text>
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    3-5 days
                                  </Text>
                                </BlockStack>
                              </Layout.Section>
                            </Layout>
                          </BlockStack>
                        </BlockStack>
                      </Card>
                    </Layout.Section>
                  </Layout>
                )}

                {selectedTab === 3 && (
                  <Layout>
                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Distribution Network
                          </Text>
                          <Card background="bg-surface-info">
                            <BlockStack gap="100">
                              <Text variant="bodyMd" fontWeight="medium" as="span">
                                Primary Hub
                              </Text>
                              <Text variant="bodyMd" as="span">
                                {productData.distributionCenter}
                              </Text>
                              <Text variant="bodySm" tone="subdued" as="span">
                                Serves {productData.region}
                              </Text>
                            </BlockStack>
                          </Card>
                          <Layout>
                            <Layout.Section variant="oneHalf">
                              <Card background="bg-surface-secondary">
                                <BlockStack gap="100">
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    Avg Shipping Time
                                  </Text>
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    2.3 days
                                  </Text>
                                </BlockStack>
                              </Card>
                            </Layout.Section>
                            <Layout.Section variant="oneHalf">
                              <Card background="bg-surface-secondary">
                                <BlockStack gap="100">
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    Shipping Cost
                                  </Text>
                                  <Text variant="bodyMd" fontWeight="medium" as="span">
                                    $12.50/unit
                                  </Text>
                                </BlockStack>
                              </Card>
                            </Layout.Section>
                          </Layout>
                        </BlockStack>
                      </Card>
                    </Layout.Section>

                    <Layout.Section variant="oneHalf">
                      <Card>
                        <BlockStack gap="300">
                          <Text variant="headingMd" as="h3">
                            Transportation Schedule
                          </Text>
                          <BlockStack gap="200">
                            <Banner tone="success" title="Next Delivery">
                              <BlockStack gap="100">
                                <Text as="p" variant="bodyMd">
                                  To retail locations
                                </Text>
                                <Text as="p" variant="bodyMd" fontWeight="medium">
                                  Tomorrow • On Schedule
                                </Text>
                              </BlockStack>
                            </Banner>
                            <Banner tone="warning" title="Inbound Freight">
                              <BlockStack gap="100">
                                <Text as="p" variant="bodyMd">
                                  From manufacturing
                                </Text>
                                <Text as="p" variant="bodyMd" fontWeight="medium">
                                  {productData.nextShipment} • In Transit
                                </Text>
                              </BlockStack>
                            </Banner>
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

      {/* Modals */}
      <Modal
        open={isExpediteModalActive}
        onClose={() => setIsExpediteModalActive(false)}
        title={isLowStock ? "Expedite Emergency Shipment?" : "Schedule Standard Shipment?"}
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
                ? `Critical stock shortage detected. This will authorize emergency shipment of 3,000 units via air freight. Estimated cost: $45,000. Delivery time: 24-48 hours.`
                : `Schedule standard shipment of 2,500 units via ground transport. Estimated cost: $8,500. Delivery time: 5-7 days.`}
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
        title={`Contact ${productData.retailPartner}`}
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
                {productData.forecastDemand.toLocaleString()} units
              </Text>
            </BlockStack>
            <TextField
              label="New Forecast"
              type="number"
              value={productData.forecastDemand.toString()}
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
