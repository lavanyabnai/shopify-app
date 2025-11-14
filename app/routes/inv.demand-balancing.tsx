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

interface DemandBalancingItem {
  id: string
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

const demandBalancingData: DemandBalancingItem[] = [
  {
    id: "1",
    sourceLocation: "META-CA-01",
    materialCode: "VR-Q3-128",
    revenueImpact: 4291328,
    unitImpact: 199597,
    impactCoverage: 100.0,
    confidenceLevel: 81.21,
    predictedAction: "Transfer",
    actionPriority: "High",
    dueDate: "01/18/2025",
    description: "Transfer 5,500 units of Quest 3 128GB to META-TX-01 DC to fill projected backorders",
    alertType: "Stock Shortage",
    transferLeadTime: "3-5 days",
    currentStock: 12450,
    projectedDemand: 18000,
  },
  {
    id: "2",
    sourceLocation: "META-EU-01",
    materialCode: "VR-Q3-512",
    revenueImpact: 3306994,
    unitImpact: 459010,
    impactCoverage: 100.0,
    confidenceLevel: 88.6,
    predictedAction: "Expedite",
    actionPriority: "High",
    dueDate: "01/20/2025",
    description: "Expedite existing stock transfer of 459,010 units of Quest 3 512GB to META-APAC-01 DC",
    alertType: "Critical Shortage",
    transferLeadTime: "7-10 days",
    currentStock: 8920,
    projectedDemand: 15200,
  },
  {
    id: "3",
    sourceLocation: "META-TX-01",
    materialCode: "VR-PRO-256",
    revenueImpact: 2999437,
    unitImpact: 139185,
    impactCoverage: 100.0,
    confidenceLevel: 85.06,
    predictedAction: "Transfer",
    actionPriority: "High",
    dueDate: "01/19/2025",
    description: "Transfer 139,185 units of Quest Pro to META-NJ-01 DC to fill projected backorders",
    alertType: "Stock Shortage",
    transferLeadTime: "2-4 days",
    currentStock: 2340,
    projectedDemand: 8500,
  },
  {
    id: "4",
    sourceLocation: "META-CA-01",
    materialCode: "VR-PRO-256",
    revenueImpact: 2029513,
    unitImpact: 96277,
    impactCoverage: 100.0,
    confidenceLevel: 85.06,
    predictedAction: "Transfer",
    actionPriority: "Medium",
    dueDate: "01/22/2025",
    description: "Transfer 96,277 units of Quest Pro to META-UK-01 DC to fill projected backorders",
    alertType: "Low Stock",
    transferLeadTime: "5-7 days",
    currentStock: 1890,
    projectedDemand: 4200,
  },
  {
    id: "5",
    sourceLocation: "META-APAC-01",
    materialCode: "VR-Q3-128",
    revenueImpact: 1937593,
    unitImpact: 193480,
    impactCoverage: 100.0,
    confidenceLevel: 82.27,
    predictedAction: "Expedite",
    actionPriority: "High",
    dueDate: "01/21/2025",
    description: "Expedite existing stock transfer of 193,480 units of Quest 3 128GB to META-CA-01 DC",
    alertType: "Stock Shortage",
    transferLeadTime: "8-12 days",
    currentStock: 4560,
    projectedDemand: 9200,
  },
  {
    id: "6",
    sourceLocation: "META-EU-01",
    materialCode: "VR-Q3-BUNDLE",
    revenueImpact: 1850740,
    unitImpact: 191730,
    impactCoverage: 100.0,
    confidenceLevel: 80.07,
    predictedAction: "Transfer",
    actionPriority: "Medium",
    dueDate: "01/25/2025",
    description: "Transfer 191,730 units of Quest 3 Elite Bundle to META-CA-01 DC to fill projected backorders",
    alertType: "Optimal Stock",
    transferLeadTime: "6-8 days",
    currentStock: 3420,
    projectedDemand: 4500,
  },
  {
    id: "7",
    sourceLocation: "META-APAC-01",
    materialCode: "VR-Q3-512",
    revenueImpact: 1727740,
    unitImpact: 225300,
    impactCoverage: 100.0,
    confidenceLevel: 86.55,
    predictedAction: "Manufacture",
    actionPriority: "High",
    dueDate: "01/23/2025",
    description: "Manufacture additional 225,300 units of Quest 3 512GB to fill projected backorders",
    alertType: "Critical Shortage",
    transferLeadTime: "14-21 days",
    currentStock: 890,
    projectedDemand: 12000,
  },
  {
    id: "8",
    sourceLocation: "META-TX-01",
    materialCode: "VR-Q3-128",
    revenueImpact: 1450534,
    unitImpact: 134558,
    impactCoverage: 100.0,
    confidenceLevel: 87.09,
    predictedAction: "Transfer",
    actionPriority: "Medium",
    dueDate: "01/24/2025",
    description: "Transfer 134,558 units of Quest 3 128GB to META-EU-01 DC to fill projected backorders",
    alertType: "Low Stock",
    transferLeadTime: "4-6 days",
    currentStock: 7240,
    projectedDemand: 6800,
  },
]

export const loader: LoaderFunction = async () => {
  return json({ data: demandBalancingData })
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

function getActionBadge(action: string) {
  switch (action) {
    case "Transfer":
      return <Badge tone="info">Transfer</Badge>
    case "Expedite":
      return <Badge tone="warning">Expedite</Badge>
    case "Manufacture":
      return <Badge tone="attention">Manufacture</Badge>
    default:
      return <Badge>{action}</Badge>
  }
}

export default function DemandBalancingPage() {
  const { data } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const resourceName = {
    singular: 'alert',
    plural: 'alerts',
  }

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(data)

  const openAlerts = data.filter((item: DemandBalancingItem) => item.actionPriority === "High").length
  const totalRevenue = data.reduce((sum: number, item: DemandBalancingItem) => sum + item.revenueImpact, 0)
  const avgConfidence = data.reduce((sum: number, item: DemandBalancingItem) => sum + item.confidenceLevel, 0) / data.length

  const rowMarkup = data.map(
    (item: DemandBalancingItem, index: number) => (
      <IndexTable.Row
        id={item.id}
        key={item.id}
        selected={selectedResources.includes(item.id)}
        position={index}
        onClick={() => navigate(`/inv/demand-balancing/${item.id}`)}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {item.sourceLocation}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Box
            as="span"
            padding="100"
            background="bg-surface-secondary"
            borderRadius="100"
          >
            <Text variant="bodySm" as="span" fontWeight="medium">
              {item.materialCode}
            </Text>
          </Box>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            ${(item.revenueImpact / 1000000).toFixed(2)}M
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.unitImpact.toLocaleString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.impactCoverage.toFixed(1)}%
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="200" blockAlign="center">
            <Text variant="bodyMd" fontWeight="medium" as="span">
              {item.confidenceLevel.toFixed(1)}%
            </Text>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>{getPriorityBadge(item.actionPriority)}</IndexTable.Cell>
        <IndexTable.Cell>{getActionBadge(item.predictedAction)}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" as="span">
            {item.dueDate}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  )

  return (
    <Page
      fullWidth
      title="META VR Supply & Demand Balancing"
      subtitle="Monitor and manage inventory transfers and demand forecasting"
      backAction={{ content: 'Control Tower', url: '/inv/control-tower' }}
      primaryAction={{
        content: 'Export Report',
        onAction: () => console.log('Export report'),
      }}
    >
      <Layout>
        {/* Summary Metrics */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Revenue Impact
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    ${(totalRevenue / 1000000).toFixed(1)}M
                  </Text>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    High Priority Alerts
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {openAlerts}
                  </Text>
                  <Badge tone="critical">Requires attention</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Average Confidence
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {avgConfidence.toFixed(1)}%
                  </Text>
                  <Badge tone="success">High accuracy</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Alerts
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {data.length}
                  </Text>
                  <Badge>Active</Badge>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Alert Banner */}
        <Layout.Section>
          <Banner
            tone="warning"
            title={`${openAlerts} high priority demand balancing actions require immediate attention`}
          >
            <p>
              Review the table below to take action on critical inventory transfers
              and manufacturing decisions.
            </p>
          </Banner>
        </Layout.Section>

        {/* Data Table */}
        <Layout.Section>
          <Card padding="0">
            <IndexTable
              resourceName={resourceName}
              itemCount={data.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: 'Source Location' },
                { title: 'Material Code' },
                { title: 'Revenue Impact' },
                { title: 'Unit Impact' },
                { title: 'Coverage' },
                { title: 'Confidence' },
                { title: 'Priority' },
                { title: 'Action' },
                { title: 'Due Date' },
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
