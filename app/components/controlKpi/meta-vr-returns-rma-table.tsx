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
  Banner,
  TextField,
  Icon,
  Popover,
  ActionList,
  IndexTable,
  useIndexResourceState,
  LegacyStack,
} from "@shopify/polaris"
import { AlertTriangleIcon, ChartVerticalIcon } from "@shopify/polaris-icons"
import { useNavigate } from "@remix-run/react"

interface ReturnsRMAData {
  rmaNumber: string
  productModel: string
  sku: string
  returnReason: string
  defectCategory: string
  returnQuantity: number
  returnRate: number
  customerType: string
  region: string
  alertType: string
  priority: string
  estimatedCost: number
  processingTime: string
  warrantyStatus: string
  supplierImpact: string
  rootCause: string
  dueDate: string
  batchNumber: string
  manufacturingDate: string
  qualityScore: number
  resolutionStatus: string
}
const returnsRMAData: ReturnsRMAData[] = [
  {
    rmaNumber: "RMA-2025-001847",
    productModel: "Quest 3 128GB",
    sku: "MQ3-128-WHT",
    returnReason: "Display Flickering",
    defectCategory: "Hardware Defect",
    returnQuantity: 1250,
    returnRate: 8.5,
    customerType: "Best Buy",
    region: "North America",
    alertType: "High Return Rate",
    priority: "High",
    estimatedCost: 875000,
    processingTime: "5-7 days",
    warrantyStatus: "In Warranty",
    supplierImpact: "Foxconn Technology",
    rootCause: "Display Panel Quality",
    dueDate: "01/22/2025",
    batchNumber: "QB3-2024-Q4-001",
    manufacturingDate: "2024-12-15",
    qualityScore: 3.2,
    resolutionStatus: "Under Investigation",
  },
  {
    rmaNumber: "RMA-2025-001923",
    productModel: "Quest Pro",
    sku: "MQP-256-BLK",
    returnReason: "Controller Drift",
    defectCategory: "Component Failure",
    returnQuantity: 890,
    returnRate: 12.3,
    customerType: "Meta Store",
    region: "Europe",
    alertType: "Critical Return Rate",
    priority: "Critical",
    estimatedCost: 1250000,
    processingTime: "3-5 days",
    warrantyStatus: "In Warranty",
    supplierImpact: "Luxshare Precision",
    rootCause: "Joystick Mechanism",
    dueDate: "01/19/2025",
    batchNumber: "QPR-2024-Q4-003",
    manufacturingDate: "2024-11-28",
    qualityScore: 2.8,
    resolutionStatus: "Supplier Investigation",
  },
  {
    rmaNumber: "RMA-2025-001756",
    productModel: "Quest 3 512GB",
    sku: "MQ3-512-WHT",
    returnReason: "Audio Distortion",
    defectCategory: "Audio System",
    returnQuantity: 650,
    returnRate: 6.2,
    customerType: "Amazon",
    region: "Asia Pacific",
    alertType: "Moderate Return Rate",
    priority: "Medium",
    estimatedCost: 520000,
    processingTime: "7-10 days",
    warrantyStatus: "In Warranty",
    supplierImpact: "Goertek Inc.",
    rootCause: "Speaker Assembly",
    dueDate: "01/25/2025",
    batchNumber: "QB5-2024-Q4-002",
    manufacturingDate: "2024-12-08",
    qualityScore: 3.6,
    resolutionStatus: "Quality Review",
  },
  {
    rmaNumber: "RMA-2025-001634",
    productModel: "Quest 3 Elite Strap Bundle",
    sku: "MQ3-BUNDLE-01",
    returnReason: "Strap Breakage",
    defectCategory: "Accessory Defect",
    returnQuantity: 420,
    returnRate: 15.8,
    customerType: "GameStop",
    region: "North America",
    alertType: "Critical Return Rate",
    priority: "Critical",
    estimatedCost: 315000,
    processingTime: "4-6 days",
    warrantyStatus: "In Warranty",
    supplierImpact: "AAC Technologies",
    rootCause: "Material Fatigue",
    dueDate: "01/18/2025",
    batchNumber: "QEB-2024-Q4-001",
    manufacturingDate: "2024-12-01",
    qualityScore: 2.5,
    resolutionStatus: "Design Review",
  },
  {
    rmaNumber: "RMA-2025-001512",
    productModel: "Quest 3 128GB",
    sku: "MQ3-128-WHT-EU",
    returnReason: "Tracking Issues",
    defectCategory: "Sensor Malfunction",
    returnQuantity: 780,
    returnRate: 9.1,
    customerType: "MediaMarkt",
    region: "Europe",
    alertType: "High Return Rate",
    priority: "High",
    estimatedCost: 680000,
    processingTime: "6-8 days",
    warrantyStatus: "In Warranty",
    supplierImpact: "Sony Semiconductor",
    rootCause: "Camera Calibration",
    dueDate: "01/21/2025",
    batchNumber: "QB3-2024-Q4-004",
    manufacturingDate: "2024-12-20",
    qualityScore: 3.1,
    resolutionStatus: "Firmware Update",
  },
  {
    rmaNumber: "RMA-2025-001398",
    productModel: "Quest Pro",
    sku: "MQP-256-BLK-APAC",
    returnReason: "Overheating",
    defectCategory: "Thermal Management",
    returnQuantity: 320,
    returnRate: 7.8,
    customerType: "Challenger",
    region: "Asia Pacific",
    alertType: "Moderate Return Rate",
    priority: "Medium",
    estimatedCost: 450000,
    processingTime: "8-12 days",
    warrantyStatus: "Extended Warranty",
    supplierImpact: "Qualcomm Technologies",
    rootCause: "Processor Thermal Design",
    dueDate: "01/26/2025",
    batchNumber: "QPR-2024-Q3-008",
    manufacturingDate: "2024-11-15",
    qualityScore: 3.4,
    resolutionStatus: "Engineering Analysis",
  },
  {
    rmaNumber: "RMA-2025-001289",
    productModel: "Quest 3 512GB",
    sku: "MQ3-512-WHT-CA",
    returnReason: "Battery Drain",
    defectCategory: "Power Management",
    returnQuantity: 560,
    returnRate: 11.2,
    customerType: "Best Buy Canada",
    region: "North America",
    alertType: "High Return Rate",
    priority: "High",
    estimatedCost: 595000,
    processingTime: "5-7 days",
    warrantyStatus: "In Warranty",
    supplierImpact: "Flex Ltd.",
    rootCause: "Battery Management System",
    dueDate: "01/20/2025",
    batchNumber: "QB5-2024-Q4-005",
    manufacturingDate: "2024-12-12",
    qualityScore: 2.9,
    resolutionStatus: "Supplier Audit",
  },
  {
    rmaNumber: "RMA-2025-001156",
    productModel: "Quest 3 128GB",
    sku: "MQ3-128-WHT-UK",
    returnReason: "Software Crashes",
    defectCategory: "Software Issue",
    returnQuantity: 390,
    returnRate: 4.8,
    customerType: "Currys",
    region: "Europe",
    alertType: "Low Return Rate",
    priority: "Low",
    estimatedCost: 280000,
    processingTime: "10-14 days",
    warrantyStatus: "In Warranty",
    supplierImpact: "Internal Software",
    rootCause: "Firmware Bug",
    dueDate: "01/28/2025",
    batchNumber: "QB3-2024-Q4-007",
    manufacturingDate: "2024-12-18",
    qualityScore: 4.1,
    resolutionStatus: "Software Patch",
  },
]

function getAlertBadge(alertType: string) {
  switch (alertType) {
    case "Critical Return Rate":
      return <Badge tone="critical">Critical Return Rate</Badge>
    case "High Return Rate":
      return <Badge tone="warning">High Return Rate</Badge>
    case "Moderate Return Rate":
      return <Badge tone="attention">Moderate Return Rate</Badge>
    case "Low Return Rate":
      return <Badge tone="success">Low Return Rate</Badge>
    default:
      return <Badge>{alertType}</Badge>
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "Critical":
      return <Badge tone="critical">Critical</Badge>
    case "High":
      return <Badge tone="warning">High</Badge>
    case "Medium":
      return <Badge tone="attention">Medium</Badge>
    case "Low":
      return <Badge tone="info">Low</Badge>
    default:
      return <Badge>{priority}</Badge>
  }
}

function getResolutionStatusBadge(status: string) {
  switch (status) {
    case "Under Investigation":
    case "Supplier Investigation":
      return <Badge tone="critical">{status}</Badge>
    case "Quality Review":
    case "Design Review":
    case "Engineering Analysis":
    case "Supplier Audit":
      return <Badge tone="warning">{status}</Badge>
    case "Firmware Update":
    case "Software Patch":
      return <Badge tone="info">{status}</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function MetaVRReturnsRMATable() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [popoverActive, setPopoverActive] = useState<{[key: number]: boolean}>({})

  const criticalAlerts = returnsRMAData.filter((item) => item.priority === "Critical").length
  const totalCost = returnsRMAData.reduce((sum, item) => sum + item.estimatedCost, 0)
  const totalReturns = returnsRMAData.reduce((sum, item) => sum + item.returnQuantity, 0)
  const avgReturnRate = returnsRMAData.reduce((sum, item) => sum + item.returnRate, 0) / returnsRMAData.length

  // Filter data based on search
  const filteredData = returnsRMAData.filter(
    (item) =>
      item.rmaNumber.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.productModel.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.returnReason.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSearchChange = useCallback((value: string) => setSearchValue(value), [])

  const togglePopover = useCallback((index: number) => {
    setPopoverActive((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }, [])

  const handleAction = useCallback(
    (action: string, item: ReturnsRMAData, index: number) => {
      console.log(`Action: ${action} for RMA:`, item.rmaNumber)
      switch (action) {
        case "view":
          navigate(`/inv/returns-rma/${encodeURIComponent(item.rmaNumber)}-${encodeURIComponent(item.sku)}-${index}`)
          break
        default:
          break
      }
    },
    [navigate]
  )

  const resourceName = {
    singular: "RMA",
    plural: "RMAs",
  }

  const resourceStateData = filteredData.map((item) => ({ ...item, id: item.rmaNumber }))
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(resourceStateData)

  const rowMarkup = filteredData.map((item, index) => (
    <IndexTable.Row
      id={item.rmaNumber}
      key={item.rmaNumber}
      selected={selectedResources.includes(item.rmaNumber)}
      position={index}
      onClick={() =>
        navigate(`/inv/returns-rma/${encodeURIComponent(item.rmaNumber)}-${encodeURIComponent(item.sku)}-${index}`)
      }
    >
      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {item.rmaNumber}
          </Text>
          <Text variant="bodySm" tone="subdued" as="span">
            {item.customerType}
          </Text>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="medium" as="span">
            {item.productModel}
          </Text>
          <Box background="bg-surface-secondary" padding="050" borderRadius="100" as="span">
            <Text variant="bodySm" fontWeight="medium" as="span" tone="subdued">
              {item.sku}
            </Text>
          </Box>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="medium" as="span">
            {item.returnReason}
          </Text>
          <Text variant="bodySm" tone="subdued" as="span">
            {item.defectCategory}
          </Text>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <InlineStack gap="100" blockAlign="center">
            <Text variant="bodyMd" fontWeight="bold" tone="critical" as="span">
              {item.returnRate}%
            </Text>
            <div style={{ width: '16px', height: '16px' }}>
              <ChartVerticalIcon />
            </div>
          </InlineStack>
          {getAlertBadge(item.alertType)}
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="medium" as="span">
          {item.returnQuantity.toLocaleString()}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="medium" as="span">
          ${(item.estimatedCost / 1000000).toFixed(2)}M
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>{getPriorityBadge(item.priority)}</IndexTable.Cell>

      <IndexTable.Cell>{getResolutionStatusBadge(item.resolutionStatus)}</IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodySm" as="span">
          {item.dueDate}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Popover
          active={popoverActive[index]}
          activator={
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                variant="tertiary"
                icon="horizontalDots"
                onClick={() => togglePopover(index)}
              />
            </div>
          }
          onClose={() => togglePopover(index)}
        >
          <ActionList
            items={[
              {
                content: "View RMA Details",
                onAction: () => {
                  handleAction("view", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
              {
                content: "Process Return",
                onAction: () => {
                  handleAction("process", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
              {
                content: "Contact Customer",
                onAction: () => {
                  handleAction("contact", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
              {
                content: "Escalate Issue",
                onAction: () => {
                  handleAction("escalate", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
              {
                content: "Generate Report",
                onAction: () => {
                  handleAction("report", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
            ]}
          />
        </Popover>
      </IndexTable.Cell>
    </IndexTable.Row>
  ))

  const columnHeadings = [
    "RMA Number",
    "Product Model",
    "Return Reason",
    "Return Rate",
    "Quantity",
    "Cost Impact",
    "Priority",
    "Resolution Status",
    "Due Date",
    "",
  ]

  return (
    <Page
      fullWidth
      title="META VR Returns & RMA Management"
      subtitle="Monitor product returns, defects, and RMA processing"
      primaryAction={{
        content: `Total Cost: $${(totalCost / 1000000).toFixed(1)}M`,
        disabled: true,
      }}
      secondaryActions={[
        {
          content: `Avg Return Rate: ${avgReturnRate.toFixed(1)}%`,
          disabled: true,
        },
      ]}
    >
      <Layout>
        {/* Alert Summary */}
        <Layout.Section>
          <Banner title="Active RMA Alerts" tone="warning" icon={AlertTriangleIcon}>
            <InlineStack gap="400">
              <LegacyStack spacing="tight">
                <Text variant="bodyMd" as="span">
                  Active RMAs:
                </Text>
                <Badge tone="attention">{returnsRMAData.length.toString()}</Badge>
              </LegacyStack>
              <LegacyStack spacing="tight">
                <Text variant="bodyMd" as="span">
                  Critical Issues:
                </Text>
                <Badge tone="critical">{criticalAlerts.toString()}</Badge>
              </LegacyStack>
              <LegacyStack spacing="tight">
                <Text variant="bodyMd" as="span">
                  Total Returns:
                </Text>
                <Badge tone="info">{totalReturns.toLocaleString()}</Badge>
              </LegacyStack>
              <Text variant="bodySm" as="span">
                Processing Time: 3-14 days
              </Text>
            </InlineStack>
          </Banner>
        </Layout.Section>

        {/* Search */}
        <Layout.Section>
          <Card>
            <div style={{ maxWidth: "400px" }}>
              <TextField
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search by RMA, product, defect..."
                prefix={<Icon source="search" />}
                clearButton
                onClearButtonClick={() => setSearchValue("")}
                autoComplete="off"
                label=""
              />
            </div>
          </Card>
        </Layout.Section>

        {/* Data Table */}
        <Layout.Section>
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={filteredData.length}
              selectedItemsCount={allResourcesSelected ? filteredData.length : selectedResources.length}
              onSelectionChange={handleSelectionChange}
              headings={
                columnHeadings.length > 0
                  ? (columnHeadings.map((heading) => ({ title: heading })) as [ { title: string } & Record<string, unknown>, ...Array<{ title: string } & Record<string, unknown>> ])
                  : ([{ title: "No columns" }] as [ { title: string } & Record<string, unknown> ])
              }
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>

        {/* Results count */}
        <Layout.Section>
          {searchValue && (
            <Text variant="bodySm" tone="subdued" as="span">
              Showing {filteredData.length} of {returnsRMAData.length} results
            </Text>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  )
}
