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

interface SafetyStockAlert {
  id: string
  skuCode: string
  productName: string
  location: string
  currentSafetyStock: number
  recommendedSafetyStock: number
  safetyStockDays: number
  inventorySavings: number
  serviceRiskReduction: number
  co2Impact: number
  segment: string
  targetServiceLevel: number
  priority: string
  createdDate: string
}

const safetyStockData: SafetyStockAlert[] = [
  {
    id: "1",
    skuCode: "1014",
    productName: "PLASTIC BOTTLE 200ml",
    location: "Plant L003",
    currentSafetyStock: 1750,
    recommendedSafetyStock: 1400,
    safetyStockDays: 29,
    inventorySavings: 189626,
    serviceRiskReduction: 0,
    co2Impact: -20.60,
    segment: "B/Y",
    targetServiceLevel: 94,
    priority: "High",
    createdDate: "22-Sep-2024",
  },
  {
    id: "2",
    skuCode: "1006",
    productName: "GLASS BOTTLE 500ml",
    location: "Plant L001",
    currentSafetyStock: 2100,
    recommendedSafetyStock: 1800,
    safetyStockDays: 32,
    inventorySavings: 156000,
    serviceRiskReduction: 0,
    co2Impact: -18.50,
    segment: "A/X",
    targetServiceLevel: 96,
    priority: "High",
    createdDate: "20-Sep-2024",
  },
  {
    id: "3",
    skuCode: "1012",
    productName: "ALUMINUM CAN 330ml",
    location: "Plant L002",
    currentSafetyStock: 3200,
    recommendedSafetyStock: 2800,
    safetyStockDays: 35,
    inventorySavings: 124500,
    serviceRiskReduction: 0,
    co2Impact: -15.20,
    segment: "B/Y",
    targetServiceLevel: 94,
    priority: "Medium",
    createdDate: "19-Sep-2024",
  },
  {
    id: "4",
    skuCode: "1018",
    productName: "PET BOTTLE 1L",
    location: "Plant L004",
    currentSafetyStock: 1450,
    recommendedSafetyStock: 1200,
    safetyStockDays: 27,
    inventorySavings: 98750,
    serviceRiskReduction: 0,
    co2Impact: -12.40,
    segment: "B/Y",
    targetServiceLevel: 94,
    priority: "Medium",
    createdDate: "18-Sep-2024",
  },
  {
    id: "5",
    skuCode: "1020",
    productName: "GLASS JAR 250ml",
    location: "Plant L001",
    currentSafetyStock: 1850,
    recommendedSafetyStock: 1600,
    safetyStockDays: 30,
    inventorySavings: 87500,
    serviceRiskReduction: 0,
    co2Impact: -10.80,
    segment: "C/Z",
    targetServiceLevel: 92,
    priority: "Low",
    createdDate: "17-Sep-2024",
  },
  {
    id: "6",
    skuCode: "1009",
    productName: "PLASTIC CONTAINER 500ml",
    location: "Plant L003",
    currentSafetyStock: 2400,
    recommendedSafetyStock: 2100,
    safetyStockDays: 33,
    inventorySavings: 76800,
    serviceRiskReduction: 0,
    co2Impact: -9.50,
    segment: "B/Y",
    targetServiceLevel: 94,
    priority: "Low",
    createdDate: "16-Sep-2024",
  },
  {
    id: "7",
    skuCode: "1015",
    productName: "TETRA PACK 1L",
    location: "Plant L002",
    currentSafetyStock: 1950,
    recommendedSafetyStock: 1700,
    safetyStockDays: 28,
    inventorySavings: 65400,
    serviceRiskReduction: 0,
    co2Impact: -8.20,
    segment: "A/X",
    targetServiceLevel: 96,
    priority: "Medium",
    createdDate: "15-Sep-2024",
  },
  {
    id: "8",
    skuCode: "1011",
    productName: "METAL CAN 750ml",
    location: "Plant L004",
    currentSafetyStock: 1650,
    recommendedSafetyStock: 1450,
    safetyStockDays: 26,
    inventorySavings: 54200,
    serviceRiskReduction: 0,
    co2Impact: -7.10,
    segment: "C/Z",
    targetServiceLevel: 92,
    priority: "Low",
    createdDate: "14-Sep-2024",
  },
]

export const loader: LoaderFunction = async () => {
  return json({ data: safetyStockData })
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

export default function SafetyStockPage() {
  const { data } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const resourceName = {
    singular: 'alert',
    plural: 'alerts',
  }

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(data)

  const highPriorityAlerts = data.filter((item: SafetyStockAlert) => item.priority === "High").length
  const totalSavings = data.reduce((sum: number, item: SafetyStockAlert) => sum + item.inventorySavings, 0)
  const avgServiceLevel = data.reduce((sum: number, item: SafetyStockAlert) => sum + item.targetServiceLevel, 0) / data.length

  const rowMarkup = data.map(
    (item: SafetyStockAlert, index: number) => (
      <IndexTable.Row
        id={item.id}
        key={item.id}
        selected={selectedResources.includes(item.id)}
        position={index}
        onClick={() => navigate(`/inv/safety-stock/${item.id}`)}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {item.skuCode}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.productName}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.location}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.currentSafetyStock.toLocaleString()} units
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" tone="success" as="span">
            {item.recommendedSafetyStock.toLocaleString()} units
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.safetyStockDays} days
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            ${(item.inventorySavings / 1000).toFixed(1)}K
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" tone="critical" as="span">
            {item.co2Impact} kgCO2e
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{getPriorityBadge(item.priority)}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodySm" as="span">
            {item.createdDate}
          </Text>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  )

  return (
    <Page
      fullWidth
      title="Optimize Safety Stock"
      subtitle="Balance inventory costs with service levels across all locations"
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
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Inventory Savings
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    ${(totalSavings / 1000).toFixed(1)}K
                  </Text>
                  <Badge tone="success">Potential savings</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    High Priority Alerts
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {highPriorityAlerts}
                  </Text>
                  <Badge tone="critical">Requires attention</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Avg. Target Service Level
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {avgServiceLevel.toFixed(1)}%
                  </Text>
                  <Badge tone="success">Maintained</Badge>
                </BlockStack>
              </Card>
            </Box>
            <Box minWidth="220px">
              <Card>
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Total Alerts
                  </Text>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {data.length}
                  </Text>
                  <Badge>Optimization opportunities</Badge>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Alert Banner */}
        {highPriorityAlerts > 0 && (
          <Layout.Section>
            <Banner
              tone="warning"
              title={`${highPriorityAlerts} high priority safety stock optimization${highPriorityAlerts === 1 ? '' : 's'} available`}
            >
              <p>
                Review the recommendations below to reduce inventory costs while maintaining service levels.
              </p>
            </Banner>
          </Layout.Section>
        )}

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
                { title: 'SKU Code' },
                { title: 'Product Name' },
                { title: 'Location' },
                { title: 'Current Safety Stock' },
                { title: 'Recommended' },
                { title: 'Safety Stock Days' },
                { title: 'Savings' },
                { title: 'CO2 Impact' },
                { title: 'Priority' },
                { title: 'Created Date' },
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
