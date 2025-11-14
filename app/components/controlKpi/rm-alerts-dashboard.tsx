import { useState, useCallback } from "react"
import {
  Page,
  Card,
  Badge,
  Text,
  InlineStack,
  BlockStack,
  TextField,
  Icon,
  IndexTable,
  useIndexResourceState,
  LegacyStack,
} from "@shopify/polaris"
import { SearchIcon, ChartVerticalIcon } from "@shopify/polaris-icons"

interface InventoryItem {
  id: string
  gatingItem: string
  supplysite: string
  partClass: string
  responsible: string
  stockInOtherSites: boolean
  alternateSources: number
  availableSubstitutes: number
  orders: number
  orderDueDateFirst: string
  orderDueDateLast: string
  shortage: number
  revenue: number
  margin: number
  isHighlighted?: boolean
}

const inventoryData: InventoryItem[] = [
  {
    id: "1",
    gatingItem: "D3701",
    supplysite: "E3002",
    partClass: "Work In Progress",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 2,
    orderDueDateFirst: "07-31-17",
    orderDueDateLast: "07-31-17",
    shortage: 21847,
    revenue: 6629972,
    margin: 531283,
    isHighlighted: true,
  },
  {
    id: "2",
    gatingItem: "P1001",
    supplysite: "P1001",
    partClass: "Work In Progress",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 2,
    orderDueDateFirst: "07-31-17",
    orderDueDateLast: "07-31-17",
    shortage: 21847,
    revenue: 6629972,
    margin: 531283,
    isHighlighted: true,
  },
  {
    id: "3",
    gatingItem: "D3712",
    supplysite: "E3002",
    partClass: "Raw Material",
    responsible: "Master Administrator",
    stockInOtherSites: false,
    alternateSources: 2,
    availableSubstitutes: 0,
    orders: 2,
    orderDueDateFirst: "07-31-17",
    orderDueDateLast: "07-31-17",
    shortage: 1618,
    revenue: 6629972,
    margin: 531283,
    isHighlighted: true,
  },
  {
    id: "4",
    gatingItem: "P3000",
    supplysite: "C1001",
    partClass: "Work In Progress",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 2,
    orderDueDateFirst: "07-31-17",
    orderDueDateLast: "07-31-17",
    shortage: 21847,
    revenue: 6629972,
    margin: 531283,
    isHighlighted: true,
  },
  {
    id: "5",
    gatingItem: "B1001",
    supplysite: "E3001",
    partClass: "Work In Progress",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 1,
    orderDueDateFirst: "07-03-17",
    orderDueDateLast: "07-03-17",
    shortage: 353,
    revenue: 0,
    margin: 0,
    isHighlighted: true,
  },
  {
    id: "6",
    gatingItem: "B1011",
    supplysite: "E3001",
    partClass: "Raw Material",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 1,
    orderDueDateFirst: "07-03-17",
    orderDueDateLast: "07-03-17",
    shortage: 353,
    revenue: 0,
    margin: 0,
    isHighlighted: true,
  },
  {
    id: "7",
    gatingItem: "C1001",
    supplysite: "P1001",
    partClass: "Work In Progress",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 1,
    orderDueDateFirst: "07-03-17",
    orderDueDateLast: "07-03-17",
    shortage: 353,
    revenue: 0,
    margin: 0,
    isHighlighted: true,
  },
  {
    id: "8",
    gatingItem: "D2501",
    supplysite: "E3002",
    partClass: "Work In Progress",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 16,
    orderDueDateFirst: "07-03-17",
    orderDueDateLast: "07-03-17",
    shortage: 303666,
    revenue: 0,
    margin: 0,
    isHighlighted: true,
  },
  {
    id: "9",
    gatingItem: "D2512",
    supplysite: "E3002",
    partClass: "Raw Material",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 2,
    availableSubstitutes: 0,
    orders: 24,
    orderDueDateFirst: "07-03-17",
    orderDueDateLast: "07-03-17",
    shortage: 253972,
    revenue: 0,
    margin: 0,
    isHighlighted: true,
  },
  {
    id: "10",
    gatingItem: "I2500-11",
    supplysite: "C1001",
    partClass: "Work In Progress",
    responsible: "Master Administrator",
    stockInOtherSites: true,
    alternateSources: 1,
    availableSubstitutes: 0,
    orders: 2,
    orderDueDateFirst: "07-03-17",
    orderDueDateLast: "07-03-17",
    shortage: 25920,
    revenue: 0,
    margin: 0,
    isHighlighted: true,
  },
]

export default function RMAlertsDashboard() {
  const [searchValue, setSearchValue] = useState("")

  const handleSearchChange = useCallback((value: string) => setSearchValue(value), [])

  // Filter data based on search
  const filteredData = inventoryData.filter(
    (item) =>
      item.gatingItem.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.supplysite.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.partClass.toLowerCase().includes(searchValue.toLowerCase())
  )

  // Calculate summary metrics
  const totalShortage = inventoryData.reduce((sum, item) => sum + item.shortage, 0)
  const totalRevenue = inventoryData.reduce((sum, item) => sum + item.revenue, 0)
  const totalMargin = inventoryData.reduce((sum, item) => sum + item.margin, 0)

  const getPartClassBadge = (partClass: string) => {
    switch (partClass) {
      case "Work In Progress":
        return <Badge tone="info">Work In Progress</Badge>
      case "Raw Material":
        return <Badge tone="success">Raw Material</Badge>
      case "Finished Goods":
        return <Badge tone="attention">Finished Goods</Badge>
      default:
        return <Badge>{partClass}</Badge>
    }
  }

  const resourceName = {
    singular: "inventory item",
    plural: "inventory items",
  }

  const resourceStateData = filteredData.map((item) => ({ ...item }))
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(resourceStateData)

  const rowMarkup = filteredData.map((item, index) => (
    <IndexTable.Row id={item.id} key={item.id} selected={selectedResources.includes(item.id)} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {item.gatingItem}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          {item.supplysite}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>{getPartClassBadge(item.partClass)}</IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodySm" as="span">
          {item.responsible}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {item.stockInOtherSites && (
          <Badge tone="success" size="small">
            Yes
          </Badge>
        )}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" as="span" alignment="center">
          {item.alternateSources}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" as="span" alignment="center">
          {item.availableSubstitutes}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" as="span" alignment="center">
          {item.orders}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodySm" as="span">
          {item.orderDueDateFirst}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodySm" as="span">
          {item.orderDueDateLast}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" tone="critical" as="span">
          {item.shortage.toLocaleString()}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          ${(item.revenue / 1000000).toFixed(2)}M
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">
          ${(item.margin / 1000000).toFixed(2)}M
        </Text>
      </IndexTable.Cell>
    </IndexTable.Row>
  ))

  const columnHeadings = [
    "Gating Item",
    "Supply Site",
    "Part Class",
    "Responsible",
    "Stock in Other Sites",
    "Alternate Sources",
    "Available Substitutes",
    "Orders",
    "Order Due Date First",
    "Order Due Date Last",
    "Shortage",
    "Revenue",
    "Margin",
  ]

  return (
    <BlockStack gap="400">
      {/* Summary Cards */}
      <InlineStack gap="400" wrap={false}>
        <div style={{ flex: 1 }}>
          <Card>
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Shortage
                </Text>
                <div style={{ width: "16px", height: "16px" }}>
                  <ChartVerticalIcon />
                </div>
              </InlineStack>
              <Text as="h2" variant="heading2xl" fontWeight="bold">
                {totalShortage.toLocaleString()}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Units short across all parts
              </Text>
            </BlockStack>
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <Card>
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Revenue Impact
                </Text>
                <div style={{ width: "16px", height: "16px" }}>
                  <ChartVerticalIcon />
                </div>
              </InlineStack>
              <Text as="h2" variant="heading2xl" fontWeight="bold">
                ${(totalRevenue / 1000000).toFixed(1)}M
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Revenue at risk
              </Text>
            </BlockStack>
          </Card>
        </div>

        <div style={{ flex: 1 }}>
          <Card>
            <BlockStack gap="200">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  Total Margin Impact
                </Text>
                <div style={{ width: "16px", height: "16px" }}>
                  <ChartVerticalIcon />
                </div>
              </InlineStack>
              <Text as="h2" variant="heading2xl" fontWeight="bold">
                ${(totalMargin / 1000000).toFixed(1)}M
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                Margin at risk
              </Text>
            </BlockStack>
          </Card>
        </div>
      </InlineStack>

      {/* Search */}
      <Card>
        <div style={{ maxWidth: "400px" }}>
          <TextField
            value={searchValue}
            onChange={handleSearchChange}
            placeholder="Search by item, site, or class..."
            prefix={<Icon source={SearchIcon} />}
            clearButton
            onClearButtonClick={() => setSearchValue("")}
            autoComplete="off"
            label=""
          />
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Inventory Levers
          </Text>
          <IndexTable
            resourceName={resourceName}
            itemCount={filteredData.length}
            selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            headings={columnHeadings.map((heading) => ({ title: heading }))}
            selectable={false}
          >
            {rowMarkup}
          </IndexTable>

          {searchValue && (
            <Text variant="bodySm" tone="subdued" as="p">
              Showing {filteredData.length} of {inventoryData.length} results
            </Text>
          )}
        </BlockStack>
      </Card>
    </BlockStack>
  )
}
