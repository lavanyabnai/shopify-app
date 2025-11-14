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
  Icon,
} from "@shopify/polaris"
import {
  AlertCircleIcon,
  PackageIcon,
  ChartVerticalIcon,
  DeliveryIcon,
  LocationIcon,
  StoreIcon,
} from "@shopify/polaris-icons"
  
// Types
interface ControlTowerModule {
  id: string
  name: string
  description: string
  icon: any
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

const controlTowerModules: ControlTowerModule[] = [
  {
    id: "demand",
    name: "Customer Forecast Demand",
    description: "Orders > Customer allocated forecast",
    icon: ChartVerticalIcon,
    alerts: 12,
    status: "warning",
    kpi: "Forecast Accuracy: 70%",
    href: "/inv/demand-balancing",
    color: "warning",
  },
  {
    id: "finished-goods",
    name: "Finished Goods",
    description: "FG Coverage Analysis",
    icon: PackageIcon,
    alerts: 22,
    status: "critical",
    kpi: "FG Coverage: 78%",
    href: "/inv/finishGoods",
    color: "critical",
  },
  {
    id: "customer-receipt",
    name: "Customer Receipt",
    description: "Customer OTIF Performance",
    icon: DeliveryIcon,
    alerts: 18,
    status: "warning",
    kpi: "Customer OTIF: 92%",
    href: "/inv/cusRecipt",
    color: "warning",
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    description: "Production OTIF",
    icon: LocationIcon,
    alerts: 6,
    status: "normal",
    kpi: "Production OTIF: 95%",
    href: "/inv/manfDash",
    color: "success",
  },
  {
    id: "supplier",
    name: "Supplier",
    description: "Supplier OTIF",
    icon: StoreIcon,
    alerts: 8,
    status: "normal",
    kpi: "Supplier OTIF: 85%",
    href: "/inv/supplier-alerts",
    color: "info",
  },
  {
    id: "raw-materials",
    name: "Raw Materials",
    description: "RM Coverage",
    icon: PackageIcon,
    alerts: 15,
    status: "critical",
    kpi: "RM Coverage: 65%",
    href: "/inv/raw-material",
    color: "critical",
  },
]

const summaryMetrics: SummaryMetric[] = [
  { label: "OTIF Performance", value: "92%", target: "95%", status: "warning" },
  { label: "Fill Rate", value: "87%", target: "90%", status: "warning" },
  { label: "Service Level", value: "94%", target: "96%", status: "success" },
  { label: "Perfect Order", value: "89%", target: "92%", status: "warning" },
  { label: "OTIF Loss", value: "8%", trend: "critical", status: "critical" },
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
      id: "control-alerts",
      content: "Control Tower Alerts",
      panelID: "control-alerts-panel",
    },
    {
      id: "kpis",
      content: "Supply Chain KPIs",
      panelID: "kpis-panel",
    },
    {
      id: "benefits",
      content: "Performance",
      panelID: "benefits-panel",
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
      title="Supply Chain Control Tower"
      subtitle="Early Warning System & Performance Dashboard"
      primaryAction={{
        content: "Export Report",
        onAction: () => console.log("Export report"),
      }}
    >
      <Layout>
        {/* Summary Metrics */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            {metrics.map((metric: SummaryMetric, index: number) => (
              <Box key={index} minWidth="200px">
                <Card>
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {metric.label}
                    </Text>
                    <Text as="h3" variant="headingLg" fontWeight="bold">
                      {metric.value}
                    </Text>
                    {metric.target && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        Target: {metric.target}
                      </Text>
                    )}
                    <Badge tone={metric.status}>{metric.status}</Badge>
                  </BlockStack>
                </Card>
              </Box>
            ))}
          </InlineStack>
        </Layout.Section>

        {/* Alert Summary */}
        {criticalAlerts > 0 && (
          <Layout.Section>
            <Banner
              title={`${criticalAlerts} critical modules require immediate attention`}
              tone="critical"
              icon={AlertCircleIcon}
            >
              <p>
                {totalAlerts} total alerts across {modules.length} modules. Review the control tower modules below to
                take action.
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
                    {/* Control Tower Modules */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {modules.map((module: ControlTowerModule) => (
                        <Card key={module.id}>
                          <BlockStack gap="300">
                            <InlineStack align="space-between" blockAlign="start">
                              <InlineStack gap="200" blockAlign="center">
                                <Box>
                                  <Icon source={module.icon} />
                                </Box>
                                <BlockStack gap="100">
                                  <Text variant="headingSm" as="h3" fontWeight="semibold">
                                    {module.name}
                                  </Text>
                                  <Text variant="bodySm" tone="subdued" as="p">
                                    {module.description}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                              {getStatusBadge(module.status)}
                            </InlineStack>

                            <BlockStack gap="200">
                              <Text variant="bodySm" as="p">
                                {module.kpi}
                              </Text>
                              <InlineStack align="space-between">
                                <Badge tone={module.color}>{`${module.alerts} Active Alerts`}</Badge>
                                <Button
                                  url={module.href}
                                  variant="plain"
                                  textAlign="right"
                                  size="micro"
                                >
                                  View Details →
                                </Button>
                              </InlineStack>
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      ))}
                    </div>
                  </BlockStack>
                )}

                {selectedTab === 1 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Supply Chain KPIs Performance
                    </Text>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      {metrics.map((metric: SummaryMetric, index: number) => (
                        <Card key={index}>
                          <BlockStack gap="200">
                            <Text variant="bodyMd" fontWeight="semibold" as="p">
                              {metric.label}
                            </Text>
                            <InlineStack align="space-between" blockAlign="center">
                              <Text variant="headingLg" as="h4">
                                {metric.value}
                              </Text>
                              {metric.target && (
                                <Text variant="bodySm" tone="subdued" as="span">
                                  → {metric.target}
                                </Text>
                              )}
                            </InlineStack>
                            <Badge tone={metric.status}>{metric.status}</Badge>
                          </BlockStack>
                        </Card>
                      ))}
                    </div>
                  </BlockStack>
                )}

                {selectedTab === 2 && (
                  <BlockStack gap="400">
                    <Text variant="headingMd" as="h3">
                      Business Impact Summary
                    </Text>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: "16px",
                      }}
                    >
                      <Card>
                        <BlockStack gap="200">
                          <Text variant="bodySm" tone="subdued" as="p">
                            Sales Growth
                          </Text>
                          <Text variant="headingLg" fontWeight="bold" as="h4">
                            +3%
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Target: +5%
                          </Text>
                          <Badge tone="success">On track</Badge>
                        </BlockStack>
                      </Card>
                      <Card>
                        <BlockStack gap="200">
                          <Text variant="bodySm" tone="subdued" as="p">
                            OTIF Performance
                          </Text>
                          <Text variant="headingLg" fontWeight="bold" as="h4">
                            92%
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Target: 95%
                          </Text>
                          <Badge tone="warning">Below target</Badge>
                        </BlockStack>
                      </Card>
                      <Card>
                        <BlockStack gap="200">
                          <Text variant="bodySm" tone="subdued" as="p">
                            Inventory Reduction
                          </Text>
                          <Text variant="headingLg" fontWeight="bold" as="h4">
                            -2%
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            Target: -5%
                          </Text>
                          <Badge tone="info">Improving</Badge>
                        </BlockStack>
                      </Card>
                    </div>
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
