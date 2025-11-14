/* eslint-disable react/jsx-key */
import {
  Page,
  Card,
  DataTable,
  Badge,
  Button,
  TextField,
  Banner,
  Text,
  Icon,
  Popover,
  ActionList,
  Box,
  LegacyStack,
  Layout,
  IndexTable,
  useIndexResourceState
} from '@shopify/polaris'
import {
  AlertTriangleIcon
} from '@shopify/polaris-icons'
import { useState, useCallback } from 'react'
import { useParams, useNavigate } from "@remix-run/react"
import type { LoaderFunctionArgs } from "@remix-run/node"

// Types
interface InventoryItem {
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
  priority: "critical" | "high" | "normal" | "low"
}

const finishedGoodsData: InventoryItem[] = [
  {
    distributionCenter: "META Fulfillment Center (CA)",
    productModel: "Quest 3 128GB",
    sku: "MQ3-128-WHT",
    currentStock: 12450,
    forecastDemand: 18000,
    retailPartner: "Best Buy",
    region: "West Coast USA",
    alertType: "Stock Shortage",
    daysOfInventory: 23,
    lastShipment: "Jan 14, 2025",
    nextShipment: "Jan 20, 2025",
    salesVelocity: "+15%",
    retailPrice: "$499.99",
    priority: "high",
  },
  {
    distributionCenter: "META Fulfillment Center (TX)",
    productModel: "Quest 3 512GB",
    sku: "MQ3-512-WHT",
    currentStock: 8920,
    forecastDemand: 7500,
    retailPartner: "Amazon",
    region: "Central USA",
    alertType: "Optimal Stock",
    daysOfInventory: 47,
    lastShipment: "Jan 12, 2025",
    nextShipment: "Jan 25, 2025",
    salesVelocity: "+8%",
    retailPrice: "$649.99",
    priority: "normal",
  },
  {
    distributionCenter: "META Fulfillment Center (NJ)",
    productModel: "Quest Pro",
    sku: "MQP-256-BLK",
    currentStock: 2340,
    forecastDemand: 8500,
    retailPartner: "Meta Store",
    region: "East Coast USA",
    alertType: "Critical Shortage",
    daysOfInventory: 12,
    lastShipment: "Jan 10, 2025",
    nextShipment: "Jan 18, 2025",
    salesVelocity: "+22%",
    retailPrice: "$999.99",
    priority: "critical",
  },
  {
    distributionCenter: "META Europe Hub (Netherlands)",
    productModel: "Quest 3 128GB",
    sku: "MQ3-128-WHT-EU",
    currentStock: 15680,
    forecastDemand: 12000,
    retailPartner: "MediaMarkt",
    region: "Europe",
    alertType: "Overstock",
    daysOfInventory: 65,
    lastShipment: "Jan 08, 2025",
    nextShipment: "Feb 01, 2025",
    salesVelocity: "-3%",
    retailPrice: "€549.99",
    priority: "low",
  },
  {
    distributionCenter: "META Asia Pacific (Singapore)",
    productModel: "Quest 3 512GB",
    sku: "MQ3-512-WHT-APAC",
    currentStock: 4560,
    forecastDemand: 9200,
    retailPartner: "Challenger",
    region: "Southeast Asia",
    alertType: "Stock Shortage",
    daysOfInventory: 18,
    lastShipment: "Jan 13, 2025",
    nextShipment: "Jan 22, 2025",
    salesVelocity: "+28%",
    retailPrice: "S$899",
    priority: "high",
  },
  {
    distributionCenter: "META Fulfillment Center (IL)",
    productModel: "Quest 3 Elite Strap Bundle",
    sku: "MQ3-BUNDLE-01",
    currentStock: 3420,
    forecastDemand: 4500,
    retailPartner: "GameStop",
    region: "Midwest USA",
    alertType: "Low Stock",
    daysOfInventory: 28,
    lastShipment: "Jan 11, 2025",
    nextShipment: "Jan 24, 2025",
    salesVelocity: "+12%",
    retailPrice: "$629.99",
    priority: "normal",
  },
  {
    distributionCenter: "META Canada Hub (Toronto)",
    productModel: "Quest Pro",
    sku: "MQP-256-BLK-CA",
    currentStock: 1890,
    forecastDemand: 2800,
    retailPartner: "Best Buy Canada",
    region: "Canada",
    alertType: "Stock Shortage",
    daysOfInventory: 24,
    lastShipment: "Jan 09, 2025",
    nextShipment: "Jan 19, 2025",
    salesVelocity: "+18%",
    retailPrice: "CAD $1,349.99",
    priority: "high",
  },
  {
    distributionCenter: "META UK Hub (London)",
    productModel: "Quest 3 128GB",
    sku: "MQ3-128-WHT-UK",
    currentStock: 7240,
    forecastDemand: 6800,
    retailPartner: "Currys",
    region: "United Kingdom",
    alertType: "Optimal Stock",
    daysOfInventory: 42,
    lastShipment: "Jan 15, 2025",
    nextShipment: "Jan 28, 2025",
    salesVelocity: "+5%",
    retailPrice: "£479.99",
    priority: "normal",
  },
]

// Loader function for Remix
export const loader = async ({ params }: LoaderFunctionArgs) => {
  return {
    inventoryData: finishedGoodsData,
    workspaceId: params.workspaceId
  }
}

function getAlertBadge(alertType: string, priority: string) {
  switch (priority) {
    case "critical":
      return <Badge tone="critical">{alertType}</Badge>
    case "high":
      return <Badge tone="warning">{alertType}</Badge>
    case "low":
      return <Badge tone="info">{alertType}</Badge>
    case "normal":
      return <Badge tone="success">{alertType}</Badge>
    default:
      return <Badge>{alertType}</Badge>
  }
}

function getSalesVelocityIcon(velocity: string) {
  const isPositive = velocity.startsWith("+")
  return (
    <LegacyStack spacing="tight" alignment="center">
      <Text 
        variant="bodySm" 
        tone={isPositive ? "success" : "critical"} 
        as="span"
        fontWeight="medium"
      >
        {isPositive ? "↗" : "↘"} {velocity}
      </Text>
    </LegacyStack>
  )
}

export default function MetaVRFinishedGoodsTable() {
  const params = useParams()
  const navigate = useNavigate()
  
  const [searchValue, setSearchValue] = useState('')
  const [popoverActive, setPopoverActive] = useState<{[key: number]: boolean}>({})
  
  // Filter data based on search
  const filteredData = finishedGoodsData.filter(item =>
    item.sku.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.productModel.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.distributionCenter.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.region.toLowerCase().includes(searchValue.toLowerCase())
  )
  
  const criticalAlerts = filteredData.filter((item) => item.priority === "critical").length
  const highAlerts = filteredData.filter((item) => item.priority === "high").length
  const totalUnits = filteredData.reduce((sum, item) => sum + item.currentStock, 0)

  const handleSearchChange = useCallback((value: string) => setSearchValue(value), [])

  const togglePopover = useCallback((index: number) => {
    setPopoverActive(prev => ({
      ...prev,
      [index]: !prev[index]
    }))
  }, [])


  const handleAction = useCallback((action: string, item: InventoryItem) => {
    console.log(`Action: ${action} for item:`, item.sku)
    switch (action) {
      case 'view':
        navigate(`/inv/finished-goods/${item.sku}`)
        break
      case 'adjust':
        navigate(`/inv/finished-goods/${item.sku}`)
        break
      case 'schedule':
        navigate(`/inv/finished-goods/${item.sku}`)
        break
      default:
        break
    }
  }, [navigate])

  const resourceName = {
    singular: 'finished good',
    plural: 'finished goods',
  }

  const resourceStateData = filteredData.map(item => ({ ...item, id: item.sku }))
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(resourceStateData)

  const rowMarkup = filteredData.map((item, index) => (
    <IndexTable.Row
      id={item.sku}
      key={item.sku}
      selected={selectedResources.includes(item.sku)}
      position={index}
      onClick={() => navigate(`/inv/finished-goods/${item.sku}`)}
    >
      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {item.distributionCenter.split(" (")[0]}
          </Text>
          <Text variant="bodySm" tone="subdued" as="span">
            {item.region}
          </Text>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="medium" as="span">
          {item.productModel}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Box
          background="bg-surface-secondary"
          padding="100"
          borderRadius="100"
          as="span"
        >
          <Text variant="bodyMd" fontWeight="medium" as="span" tone="subdued">
            {item.sku}
          </Text>
        </Box>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="medium" as="span">
          {item.currentStock.toLocaleString()} units
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <LegacyStack spacing="extraTight">
            <Text variant="bodySm" tone="subdued" as="span">Forecast:</Text>
            <Text variant="bodySm" fontWeight="medium" as="span">
              {item.forecastDemand.toLocaleString()}
            </Text>
          </LegacyStack>
          <Text variant="bodySm" tone="subdued" as="span">
            {item.currentStock > item.forecastDemand ? "Surplus" : "Deficit"}:{" "}
            {Math.abs(item.currentStock - item.forecastDemand).toLocaleString()}
          </Text>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {getAlertBadge(item.alertType, item.priority)}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="medium" as="span">
            {item.daysOfInventory} days
          </Text>
          <Text variant="bodySm" tone="subdued" as="span">
            {item.daysOfInventory < 20
              ? "Low coverage"
              : item.daysOfInventory > 50
                ? "High coverage"
                : "Good coverage"}
          </Text>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" as="span">{item.retailPartner}</Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        {getSalesVelocityIcon(item.salesVelocity)}
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodySm" as="span">{item.nextShipment}</Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="medium" as="span">{item.retailPrice}</Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Popover
          active={popoverActive[index]}
          activator={
            <Button
              variant="tertiary"
              icon="horizontalDots"
              onClick={(e) => {
                e.stopPropagation()
                togglePopover(index)
              }}
            />
          }
          onClose={() => togglePopover(index)}
        >
          <ActionList
            items={[
              {
                content: 'View Inventory Details',
                onAction: () => {
                  handleAction('view', item)
                  setPopoverActive(prev => ({ ...prev, [index]: false }))
                }
              },
              {
                content: 'Adjust Forecast',
                onAction: () => {
                  handleAction('adjust', item)
                  setPopoverActive(prev => ({ ...prev, [index]: false }))
                }
              },
              {
                content: 'Schedule Shipment',
                onAction: () => {
                  handleAction('schedule', item)
                  setPopoverActive(prev => ({ ...prev, [index]: false }))
                }
              },
              {
                content: 'Contact Retail Partner',
                onAction: () => {
                  handleAction('contact', item)
                  setPopoverActive(prev => ({ ...prev, [index]: false }))
                }
              },
              {
                content: 'Generate Sales Report',
                onAction: () => {
                  handleAction('report', item)
                  setPopoverActive(prev => ({ ...prev, [index]: false }))
                }
              },
            ]}
          />
        </Popover>
      </IndexTable.Cell>
    </IndexTable.Row>
  ))

  const columnHeadings = [
    'Distribution Center',
    'Product Model',
    'SKU',
    'Current Stock',
    'Forecast vs Actual',
    'Alert Status',
    'Days of Inventory',
    'Retail Partner',
    'Sales Velocity',
    'Next Shipment',
    'Retail Price',
    ''
  ]

  return (
    <Page
      fullWidth
      title="META VR Finished Goods Inventory"
      subtitle="Monitor VR headset distribution and retail inventory levels"
      primaryAction={{
        content: `${totalUnits.toLocaleString()} Total Units in Stock`,
        disabled: true
      }}
    >
      <Layout>
        <Layout.Section>
          {/* Alert Banner */}
          {(criticalAlerts > 0 || highAlerts > 0) && (
            <Banner
              title="Inventory Alerts"
              tone="critical"
              icon={AlertTriangleIcon}
            >
              <LegacyStack spacing="loose">
                {criticalAlerts > 0 && (
                  <LegacyStack spacing="tight">
                    <Text variant="bodyMd" as="span">Critical Shortage:</Text>
                    <Badge tone="critical">{criticalAlerts.toString()}</Badge>
                  </LegacyStack>
                )}
                {highAlerts > 0 && (
                  <LegacyStack spacing="tight">
                    <Text variant="bodyMd" as="span">Stock Shortage:</Text>
                    <Badge tone="warning">{highAlerts.toString()}</Badge>
                  </LegacyStack>
                )}
              </LegacyStack>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          {/* Search */}
          <Card>
            <div style={{ maxWidth: '400px' }}>
              <TextField
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search by SKU, model, or location..."
                prefix={<Icon source="search" />}
                clearButton
                onClearButtonClick={() => setSearchValue('')}
                autoComplete="off"
                label=""
              />
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          {/* Data Table */}
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={filteredData.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={columnHeadings.map(heading => ({ title: heading }))}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>

        <Layout.Section>
          {/* Results count */}
          {searchValue && (
            <Text variant="bodySm" tone="subdued" as="span">
              Showing {filteredData.length} of {finishedGoodsData.length} results
            </Text>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  )
}
