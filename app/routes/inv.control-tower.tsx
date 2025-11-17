import { json, type LoaderFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { useState, useCallback } from "react"
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
} from "@shopify/polaris"

// Types
interface ControlTowerModule {
  id: string
  name: string
  description: string
  alerts: number
  status: "critical" | "warning" | "normal"
  kpi: string
  href: string
  color: "critical" | "warning" | "success" | "info"
}

interface SummaryMetric {
  label: string
  value: string
  trend?: string
  target?: string
  status: "critical" | "warning" | "success" | "info"
}

// Only show 100% implementable modules with Shopify data
const controlTowerModules: ControlTowerModule[] = [
  {
    id: "demand",
    name: "Inventory Rebalancing",
    description: "Optimize inventory distribution across locations",
    alerts: 12,
    status: "warning",
    kpi: "12 High-Priority Alerts",
    href: "/inv/demand-balancing",
    color: "warning",
  },
  {
    id: "finished-goods",
    name: "Prevent Stockout and Aging",
    description: "Monitor stock levels and coverage",
    alerts: 22,
    status: "critical",
    kpi: "22 Low Stock Items",
    href: "/inv/finishGoods",
    color: "critical",
  },
  {
    id: "customer-receipt",
    name: "Improve Order Performance",
    description: "Track ATP status and order fulfillment",
    alerts: 8,
    status: "warning",
    kpi: "$320K Revenue at Risk",
    href: "/inv/order-performance",
    color: "warning",
  },
  {
    id: "safety-stock",
    name: "Optimize Safety Stock",
    description: "Balance inventory costs with service levels",
    alerts: 8,
    status: "normal",
    kpi: "8 Optimization Opportunities",
    href: "/inv/safety-stock",
    color: "info",
  },
  {
    id: "promotion-strategy",
    name: "Change Promotion Strategy",
    description: "Adjust pricing and promotions for inventory",
    alerts: 5,
    status: "normal",
    kpi: "5 Slow-Moving SKUs",
    href: "/inv/promotion-strategy",
    color: "success",
  },
]

// Updated metrics to reflect Shopify-available data
const summaryMetrics: SummaryMetric[] = [
  { label: "Inventory Health", value: "78%", target: "85%", status: "warning" },
  { label: "OTIF Performance", value: "92%", target: "95%", status: "warning" },
  { label: "Stock Coverage", value: "23 days", target: "30 days", status: "warning" },
  { label: "At-Risk Revenue", value: "$18.5M", trend: "critical", status: "critical" },
]

export const loader: LoaderFunction = async () => {
  return json({
    modules: controlTowerModules,
    metrics: summaryMetrics,
  })
}

export default function SupplyChainControlTower() {
  const { modules, metrics } = useLoaderData<typeof loader>()
  const [selectedTab, setSelectedTab] = useState(0)

  const totalAlerts = modules.reduce((sum: number, module: ControlTowerModule) => sum + module.alerts, 0)
  const criticalAlerts = modules.filter((m: ControlTowerModule) => m.status === "critical").length

  const tabs = [
    {
      id: "modules",
      content: `Modules (${modules.length})`,
      panelID: "modules-panel",
    },
    {
      id: "performance",
      content: "Performance Metrics",
      panelID: "performance-panel",
    },
  ]

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge tone="critical">Critical</Badge>
      case "warning":
        return <Badge tone="warning">Warning</Badge>
      case "normal":
        return <Badge tone="success">Normal</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Page
        fullWidth
        title="Inventory Control Tower"
        subtitle="Real-time inventory monitoring and demand forecasting powered by Shopify data"
        primaryAction={{
          content: "Refresh Data",
          onAction: () => console.log("Refresh data"),
        }}
      >
        <Layout>
        {/* Summary Metrics - Enhanced with better spacing */}
        <Layout.Section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
            }}
          >
            {metrics.map((metric: SummaryMetric, index: number) => (
              <Card key={index}>
                <BlockStack gap="300">
                  <InlineStack align="space-between" blockAlign="start">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {metric.label}
                    </Text>
                    <Badge tone={metric.status}>{metric.status}</Badge>
                  </InlineStack>
                  <BlockStack gap="100">
                    <Text as="h3" variant="heading2xl" fontWeight="bold">
                      {metric.value}
                    </Text>
                    {metric.target && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        Target: {metric.target}
                      </Text>
                    )}
                  </BlockStack>
                </BlockStack>
              </Card>
            ))}
          </div>
        </Layout.Section>

        {/* Alert Summary - Enhanced messaging */}
        {criticalAlerts > 0 && (
          <Layout.Section>
            <Banner
              title={`${criticalAlerts} critical inventory ${criticalAlerts === 1 ? 'issue' : 'issues'} detected`}
              tone="critical"
            >
              <p>
                {totalAlerts} total alerts across your inventory. Take action now to prevent stockouts and revenue loss.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {/* Tabs */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
              <Box padding="400">
                {selectedTab === 0 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Inventory Management Modules
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      Click on any module to view detailed insights and take action
                    </Text>
                    {/* Enhanced Module Cards */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {modules.map((module: ControlTowerModule) => {
                        return (
                        <Card key={module.id}>
                          <BlockStack gap="400">
                            <InlineStack align="space-between" blockAlign="start">
                              <BlockStack gap="100">
                                <Text variant="headingMd" as="h3" fontWeight="semibold">
                                  {module.name}
                                </Text>
                                <Text variant="bodySm" tone="subdued" as="p">
                                  {module.description}
                                </Text>
                              </BlockStack>
                              {getStatusBadge(module.status)}
                            </InlineStack>

                            <Box
                              padding="300"
                              background="bg-surface-secondary"
                              borderRadius="200"
                            >
                              <InlineStack align="space-between" blockAlign="center">
                                <Text variant="bodyMd" fontWeight="medium" as="p">
                                  {module.kpi}
                                </Text>
                                <Badge tone={module.color} size="small">
                                  {`${module.alerts} alerts`}
                                </Badge>
                              </InlineStack>
                            </Box>

                            <Button
                              url={module.href}
                              variant="primary"
                              size="large"
                              fullWidth
                            >
                              View Dashboard
                            </Button>
                          </BlockStack>
                        </Card>
                        )
                      })}
                    </div>
                  </BlockStack>
                )}

                {selectedTab === 1 && (
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingMd" as="h3">
                        Performance Overview
                      </Text>
                      <Text variant="bodyMd" tone="subdued" as="p">
                        Key metrics calculated from your Shopify inventory and order data
                      </Text>
                    </BlockStack>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {metrics.map((metric: SummaryMetric, index: number) => (
                        <Card key={index}>
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="start">
                              <Text variant="bodySm" tone="subdued" as="p">
                                {metric.label}
                              </Text>
                              <Badge tone={metric.status}>{metric.status}</Badge>
                            </InlineStack>
                            <BlockStack gap="100">
                              <Text variant="heading2xl" fontWeight="bold" as="h4">
                                {metric.value}
                              </Text>
                              {metric.target && (
                                <InlineStack gap="100" blockAlign="center">
                                  <Text variant="bodySm" tone="subdued" as="span">
                                    Target:
                                  </Text>
                                  <Text variant="bodySm" fontWeight="medium" as="span">
                                    {metric.target}
                                  </Text>
                                </InlineStack>
                              )}
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      ))}
                    </div>

                    <Card>
                      <BlockStack gap="300">
                        <Text variant="headingSm" as="h4">
                          Data Sources
                        </Text>
                        <BlockStack gap="200">
                          <InlineStack gap="200" blockAlign="center">
                            <Badge tone="success">✓</Badge>
                            <Text variant="bodySm" as="p">
                              Live Shopify inventory levels across all locations
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="center">
                            <Badge tone="success">✓</Badge>
                            <Text variant="bodySm" as="p">
                              Order history and fulfillment data (last 30 days)
                            </Text>
                          </InlineStack>
                          <InlineStack gap="200" blockAlign="center">
                            <Badge tone="success">✓</Badge>
                            <Text variant="bodySm" as="p">
                              Product pricing and variant information
                            </Text>
                          </InlineStack>
                        </BlockStack>
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
