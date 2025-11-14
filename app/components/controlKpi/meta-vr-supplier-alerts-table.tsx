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
  ProgressBar,
} from "@shopify/polaris"
import { AlertTriangleIcon, ChartVerticalIcon } from "@shopify/polaris-icons"
import { useNavigate } from "@remix-run/react"

interface SupplierAlertsData {
  supplierName: string
  supplierCode: string
  componentType: string
  materialCode: string
  alertType: string
  affectedSKUs: number
  estimatedImpact: number
  currentStock: number
  requiredStock: number
  shortagePercentage: number
  supplierStatus: string
  estimatedRecovery: string
  priority: string
  dueDate: string
  location: string
  contractValue: number
  qualityRating: number
  onTimeDelivery: number
}

const supplierAlertsData: SupplierAlertsData[] = [
  {
    supplierName: "Foxconn Technology Group",
    supplierCode: "FOX-001",
    componentType: "Quest 3 Main Assembly",
    materialCode: "VR-Q3-MAIN-128",
    alertType: "Critical OOS",
    affectedSKUs: 3,
    estimatedImpact: 2850000,
    currentStock: 450,
    requiredStock: 12000,
    shortagePercentage: 96.3,
    supplierStatus: "Production Halt",
    estimatedRecovery: "7-10 days",
    priority: "Critical",
    dueDate: "01/20/2025",
    location: "Shenzhen, China",
    contractValue: 45000000,
    qualityRating: 4.8,
    onTimeDelivery: 92.5,
  },
  {
    supplierName: "Foxconn Technology Inc.",
    supplierCode: "FOX-002",
    componentType: "Quest 3 Display Panels",
    materialCode: "VR-Q3-DISPLAY-128",
    alertType: "Severe OOS",
    affectedSKUs: 2,
    estimatedImpact: 1950000,
    currentStock: 1200,
    requiredStock: 8500,
    shortagePercentage: 85.9,
    supplierStatus: "Capacity Issues",
    estimatedRecovery: "5-7 days",
    priority: "High",
    dueDate: "01/22/2025",
    location: "Shenzhen, China",
    contractValue: 32000000,
    qualityRating: 4.9,
    onTimeDelivery: 88.2,
  },
  {
    supplierName: "Samsung Display Co.",
    supplierCode: "SAM-002",
    componentType: "OLED Display Panels",
    materialCode: "VR-OLED-90HZ",
    alertType: "Severe OOS",
    affectedSKUs: 2,
    estimatedImpact: 1950000,
    currentStock: 1200,
    requiredStock: 8500,
    shortagePercentage: 85.9,
    supplierStatus: "Capacity Issues",
    estimatedRecovery: "5-7 days",
    priority: "High",
    dueDate: "01/22/2025",
    location: "Seoul, South Korea",
    contractValue: 32000000,
    qualityRating: 4.9,
    onTimeDelivery: 88.2,
  },
  {
    supplierName: "Qualcomm Technologies Inc.",
    supplierCode: "QUA-003",
    componentType: "Snapdragon XR2+ Chips",
    materialCode: "VR-CHIP-XR2PLUS",
    alertType: "Critical OOS",
    affectedSKUs: 4,
    estimatedImpact: 3200000,
    currentStock: 180,
    requiredStock: 6000,
    shortagePercentage: 97.0,
    supplierStatus: "Supply Chain Disruption",
    estimatedRecovery: "14-21 days",
    priority: "Critical",
    dueDate: "01/18/2025",
    location: "San Diego, USA",
    contractValue: 58000000,
    qualityRating: 4.7,
    onTimeDelivery: 94.1,
  },
  {
    supplierName: "Goertek Technology Co., Ltd.",
    supplierCode: "GOE-004",
    componentType: "Audio Systems",
    materialCode: "VR-AUDIO-SPATIAL",
    alertType: "Moderate OOS",
    affectedSKUs: 2,
    estimatedImpact: 850000,
    currentStock: 2800,
    requiredStock: 5500,
    shortagePercentage: 49.1,
    supplierStatus: "Partial Production",
    estimatedRecovery: "3-5 days",
    priority: "Medium",
    dueDate: "01/25/2025",
    location: "Weifang, China",
    contractValue: 18000000,
    qualityRating: 4.6,
    onTimeDelivery: 89.7,
  },
  {
    supplierName: "Luxshare Precision Industry Co., Ltd.",
    supplierCode: "LUX-005",
    componentType: "Controller Assembly",
    materialCode: "VR-CTRL-TOUCH",
    alertType: "Severe OOS",
    affectedSKUs: 3,
    estimatedImpact: 1650000,
    currentStock: 320,
    requiredStock: 4200,
    shortagePercentage: 92.4,
    supplierStatus: "Quality Issues",
    estimatedRecovery: "10-14 days",
    priority: "High",
    dueDate: "01/19/2025",
    location: "Kunshan, China",
    contractValue: 28000000,
    qualityRating: 4.4,
    onTimeDelivery: 86.3,
  },
  {
    supplierName: "Sony Semiconductor Solutions Corporation",
    supplierCode: "SON-006",
    componentType: "Camera Sensors",
    materialCode: "VR-CAM-TRACK",
    alertType: "Critical OOS",
    affectedSKUs: 2,
    estimatedImpact: 2100000,
    currentStock: 95,
    requiredStock: 3800,
    shortagePercentage: 97.5,
    supplierStatus: "Equipment Failure",
    estimatedRecovery: "12-18 days",
    priority: "Critical",
    dueDate: "01/17/2025",
    location: "Kumamoto, Japan",
    contractValue: 35000000,
    qualityRating: 4.9,
    onTimeDelivery: 91.8,
  },
  {
    supplierName: "AAC Technologies Holdings Inc.",
    supplierCode: "AAC-007",
    componentType: "Haptic Feedback Units",
    materialCode: "VR-HAPTIC-HD",
    alertType: "Moderate OOS",
    affectedSKUs: 1,
    estimatedImpact: 680000,
    currentStock: 1850,
    requiredStock: 3200,
    shortagePercentage: 42.2,
    supplierStatus: "Raw Material Delay",
    estimatedRecovery: "4-6 days",
    priority: "Medium",
    dueDate: "01/26/2025",
    location: "Shenzhen, China",
    contractValue: 15000000,
    qualityRating: 4.5,
    onTimeDelivery: 87.9,
  },
  {
    supplierName: "Flex Limited",
    supplierCode: "FLX-008",
    componentType: "PCB Assembly",
    materialCode: "VR-PCB-MAIN",
    alertType: "Severe OOS",
    affectedSKUs: 3,
    estimatedImpact: 1420000,
    currentStock: 680,
    requiredStock: 5200,
    shortagePercentage: 86.9,
    supplierStatus: "Workforce Shortage",
    estimatedRecovery: "6-9 days",
    priority: "High",
    dueDate: "01/21/2025",
    location: "Austin, USA",
    contractValue: 22000000,
    qualityRating: 4.6,
    onTimeDelivery: 90.4,
  },
]

function getAlertBadge(alertType: string) {
  switch (alertType) {
    case "Critical OOS":
      return <Badge tone="critical">Critical OOS</Badge>
    case "Severe OOS":
      return <Badge tone="warning">Severe OOS</Badge>
    case "Moderate OOS":
      return <Badge tone="attention">Moderate OOS</Badge>
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
    default:
      return <Badge tone="info">{priority}</Badge>
  }
}

function getSupplierStatusBadge(status: string) {
  switch (status) {
    case "Production Halt":
    case "Equipment Failure":
      return <Badge tone="critical">{status}</Badge>
    case "Capacity Issues":
    case "Quality Issues":
    case "Supply Chain Disruption":
    case "Workforce Shortage":
      return <Badge tone="warning">{status}</Badge>
    case "Partial Production":
    case "Raw Material Delay":
      return <Badge tone="attention">{status}</Badge>
    default:
      return <Badge>{status}</Badge>
  }
}

export default function MetaVRSupplierAlertsTable() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [popoverActive, setPopoverActive] = useState<{[key: number]: boolean}>({})

  const criticalAlerts = supplierAlertsData.filter((item) => item.priority === "Critical").length
  const totalImpact = supplierAlertsData.reduce((sum, item) => sum + item.estimatedImpact, 0)
  const avgShortage =
    supplierAlertsData.reduce((sum, item) => sum + item.shortagePercentage, 0) / supplierAlertsData.length
  const totalAffectedSKUs = supplierAlertsData.reduce((sum, item) => sum + item.affectedSKUs, 0)

  // Filter data based on search
  const filteredData = supplierAlertsData.filter(
    (item) =>
      item.supplierName.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.componentType.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.materialCode.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.supplierCode.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSearchChange = useCallback((value: string) => setSearchValue(value), [])

  const togglePopover = useCallback((index: number) => {
    setPopoverActive((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }, [])

  const handleAction = useCallback(
    (action: string, item: SupplierAlertsData, index: number) => {
      console.log(`Action: ${action} for Supplier:`, item.supplierName)
      switch (action) {
        case "view":
          navigate(`/inv/supplier-oos/${encodeURIComponent(item.supplierCode)}-${encodeURIComponent(item.materialCode)}-${index}`)
          break
        default:
          break
      }
    },
    [navigate]
  )

  const resourceName = {
    singular: "Supplier Alert",
    plural: "Supplier Alerts",
  }

  const resourceStateData = filteredData.map((item) => ({ ...item, id: item.supplierCode }))
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(resourceStateData)

  const rowMarkup = filteredData.map((item, index) => (
    <IndexTable.Row
      id={item.supplierCode + index}
      key={item.supplierCode + index}
      selected={selectedResources.includes(item.supplierCode + index)}
      position={index}
      onClick={() =>
        navigate(`/inv/supplier-oos/${encodeURIComponent(item.supplierCode)}-${encodeURIComponent(item.materialCode)}-${index}`)
      }
    >
      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {item.supplierName}
          </Text>
          <Text variant="bodySm" tone="subdued" as="span">
            {item.location}
          </Text>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <Text variant="bodyMd" fontWeight="medium" as="span">
            {item.componentType}
          </Text>
          <Box background="bg-surface-secondary" padding="050" borderRadius="100" as="span">
            <Text variant="bodySm" fontWeight="medium" as="span" tone="subdued">
              {item.materialCode}
            </Text>
          </Box>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>{getAlertBadge(item.alertType)}</IndexTable.Cell>

      <IndexTable.Cell>
        <LegacyStack vertical spacing="extraTight">
          <InlineStack gap="100" blockAlign="center">
            <Text variant="bodyMd" fontWeight="bold" tone="critical" as="span">
              {item.shortagePercentage.toFixed(1)}%
            </Text>
            <div style={{ width: '16px', height: '16px' }}>
              <ChartVerticalIcon />
            </div>
          </InlineStack>
          <div style={{ width: '80px' }}>
          
          </div>
        </LegacyStack>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          ${(item.estimatedImpact / 1000000).toFixed(2)}M
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>{getSupplierStatusBadge(item.supplierStatus)}</IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="medium" as="span">
          {item.estimatedRecovery}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>{getPriorityBadge(item.priority)}</IndexTable.Cell>

      <IndexTable.Cell>
        <Text variant="bodySm" as="span">
          {item.dueDate}
        </Text>
      </IndexTable.Cell>

      <IndexTable.Cell>
        <Popover
          active={popoverActive[index]}
          activator={
            <Button
              variant="tertiary"
              icon="horizontalDots"
              onClick={() => {
                togglePopover(index)
              }}
            />
          }
          onClose={() => togglePopover(index)}
        >
          <ActionList
            items={[
              {
                content: "View Details",
                onAction: () => {
                  handleAction("view", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
              {
                content: "Contact Supplier",
                onAction: () => {
                  handleAction("contact", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
              {
                content: "Escalate Alert",
                onAction: () => {
                  handleAction("escalate", item, index)
                  setPopoverActive((prev) => ({ ...prev, [index]: false }))
                },
              },
              {
                content: "Find Alternatives",
                onAction: () => {
                  handleAction("alternatives", item, index)
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
    "Supplier",
    "Component Type",
    "Alert Type",
    "Shortage %",
    "Estimated Impact",
    "Supplier Status",
    "Recovery Time",
    "Priority",
    "Due Date",
    "",
  ]

  return (
    <Page
      fullWidth
      title="META VR Supplier OOS Alerts"
      subtitle="Monitor critical supplier shortages and out-of-stock situations"
      backAction={{ content: "Back to Control Tower", url: "/inv/control-tower" }}
      primaryAction={{
        content: `Total Impact: $${(totalImpact / 1000000).toFixed(1)}M`,
        disabled: true,
      }}
      secondaryActions={[
        {
          content: `Avg Shortage: ${avgShortage.toFixed(1)}%`,
          disabled: true,
        },
      ]}
    >
      <Layout>
        {/* Alert Summary */}
        <Layout.Section>
          <Banner title="Supplier OOS Alerts" tone="critical" icon={AlertTriangleIcon}>
            <InlineStack gap="400">
              <LegacyStack spacing="tight">
                <Text variant="bodyMd" as="span">
                  Total Alerts:
                </Text>
                <Badge tone="critical">{supplierAlertsData.length.toString()}</Badge>
                <Text variant="bodyMd" as="span">
                  Critical:
                </Text>
                <Badge tone="critical">{criticalAlerts.toString()}</Badge>
                <Text variant="bodyMd" as="span">
                  Affected SKUs:
                </Text>
                <Badge tone="warning">{totalAffectedSKUs.toString()}</Badge>
              </LegacyStack>
              <Text variant="bodySm" as="span">
                Immediate action required for critical suppliers
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
                placeholder="Search by supplier, component..."
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
              Showing {filteredData.length} of {filteredData.length} results
            </Text>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  )
}
