import { json, type LoaderFunction } from "@remix-run/node"
import { useLoaderData, useNavigate } from "@remix-run/react"
import {
  Page,
  Layout,
  Card,
  IndexTable,
  Badge,
  Text,
  InlineStack,
  BlockStack,
  Box,
  useIndexResourceState,
  Banner,
} from "@shopify/polaris"
import {
  getOrderPerformanceAlerts,
  getOrderPerformanceSummary,
  type OrderPerformanceAlert,
} from "../services/order-performance.server"

export const loader: LoaderFunction = async () => {
  const alerts = getOrderPerformanceAlerts()
  const summary = getOrderPerformanceSummary()

  return json({ alerts, summary })
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Unconfirmed":
      return <Badge tone="critical">Unconfirmed</Badge>
    case "Partially confirmed":
      return <Badge tone="warning">Partially Confirmed</Badge>
    case "Fully confirmed":
      return <Badge tone="success">Fully Confirmed</Badge>
    case "Limited confirmed":
      return <Badge tone="attention">Limited Confirmed</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "High":
      return <Badge tone="critical">High</Badge>
    case "Medium":
      return <Badge tone="warning">Medium</Badge>
    case "Low":
      return <Badge tone="info">Low</Badge>
    default:
      return <Badge>{priority}</Badge>
  }
}

function getLCStatusBadge(status: string) {
  switch (status) {
    case "RLSD":
      return <Badge tone="success">RLSD</Badge>
    case "FIXD":
      return <Badge tone="attention">FIXD</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function OrderPerformancePage() {
  const { alerts, summary } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const resourceName = {
    singular: 'order alert',
    plural: 'order alerts',
  }

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(alerts)

  const rowMarkup = alerts.map(
    (alert: OrderPerformanceAlert, index: number) => (
      <IndexTable.Row
        id={alert.id}
        key={alert.id}
        selected={selectedResources.includes(alert.id)}
        position={index}
        onClick={() => navigate(`/inv/order-performance/${alert.id}`)}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {alert.orderNumber}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {alert.shippingLocation}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {alert.soldToCode}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{getStatusBadge(alert.atpStatus)}</IndexTable.Cell>
        <IndexTable.Cell>{getLCStatusBadge(alert.lcStatus)}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span" tone="critical">
            ${alert.revenueAtRisk.toLocaleString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span" tone="warning">
            ${alert.penaltyCost.toLocaleString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="200" blockAlign="center">
            <Text variant="bodyMd" fontWeight="medium" as="span">
              {alert.fillRate}%
            </Text>
            <Box
              minWidth="60px"
              paddingInline="200"
              paddingBlock="100"
              background={
                alert.fillRate >= 90
                  ? "bg-fill-success"
                  : alert.fillRate >= 70
                    ? "bg-fill-warning"
                    : "bg-fill-critical"
              }
              borderRadius="100"
            >
              <Text variant="bodySm" as="span" alignment="center">
                {alert.fillRate >= 90 ? "Good" : alert.fillRate >= 70 ? "Fair" : "Poor"}
              </Text>
            </Box>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>{getPriorityBadge(alert.priority)}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" as="span">
            {new Date(alert.planShipDate).toLocaleDateString()}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  )

  return (
    <Page
      fullWidth
      title="Order Fulfillment Performance"
      subtitle="Monitor and manage ATP (Available-to-Promise) order alerts"
      backAction={{ content: 'Control Tower', url: '/inv/control-tower' }}
      primaryAction={{
        content: 'Export Report',
        onAction: () => console.log('Export report'),
      }}
    >
      <Layout>
        {/* Summary Metrics */}
        <Layout.Section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
            }}
          >
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Revenue at Risk
                </Text>
                <Text as="h3" variant="headingLg" fontWeight="bold">
                  ${summary.totalRevenueAtRisk.toLocaleString()}
                </Text>
                <Badge tone="critical">Action required</Badge>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Penalty Cost
                </Text>
                <Text as="h3" variant="headingLg" fontWeight="bold">
                  ${summary.totalPenaltyCost.toLocaleString()}
                </Text>
                <Badge tone="warning">Monitor</Badge>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">
                  Average Fill Rate
                </Text>
                <Text as="h3" variant="headingLg" fontWeight="bold">
                  {summary.avgFillRate}%
                </Text>
                <Badge tone={summary.avgFillRate >= 80 ? "success" : "warning"}>
                  {summary.avgFillRate >= 80 ? "Good" : "Needs improvement"}
                </Badge>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">
                  Open Alerts
                </Text>
                <Text as="h3" variant="headingLg" fontWeight="bold">
                  {summary.openAlerts}
                </Text>
                <Badge>Active</Badge>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">
                  Critical Alerts
                </Text>
                <Text as="h3" variant="headingLg" fontWeight="bold">
                  {summary.criticalAlerts}
                </Text>
                <Badge tone="critical">Urgent</Badge>
              </BlockStack>
            </Card>
            <Card>
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Alerts
                </Text>
                <Text as="h3" variant="headingLg" fontWeight="bold">
                  {summary.totalAlerts}
                </Text>
                <Badge>All statuses</Badge>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>

        {/* Alert Banner */}
        {summary.criticalAlerts > 0 && (
          <Layout.Section>
            <Banner
              tone="critical"
              title={`${summary.criticalAlerts} critical order fulfillment ${summary.criticalAlerts === 1 ? 'alert requires' : 'alerts require'} immediate attention`}
            >
              <p>
                ${summary.totalRevenueAtRisk.toLocaleString()} in revenue is at risk. Review ATP status and take action to improve fill rates.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {/* Data Table */}
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={alerts.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: 'Order Number' },
                { title: 'Shipping Location' },
                { title: 'Sold-To Code' },
                { title: 'ATP Status' },
                { title: 'LC Status' },
                { title: 'Revenue at Risk' },
                { title: 'Penalty Cost' },
                { title: 'Fill Rate' },
                { title: 'Priority' },
                { title: 'Plan Ship Date' },
              ]}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
