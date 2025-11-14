import { useState } from "react"
import {
  Page,
  Layout,
  Card,
  Text,
  Badge,
  Button,
  BlockStack,
  InlineStack,
  Box,
  Divider,
  ProgressBar,
  Modal,
  Banner,
  LegacyStack,
} from "@shopify/polaris"
import {
  AlertTriangleIcon,
  PackageIcon,
  ClockIcon,
  ChartVerticalIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  LocationIcon,
  StarFilledIcon,
} from "@shopify/polaris-icons"
import { useNavigate } from "@remix-run/react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts"

interface SupplierData {
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

interface SupplierOOSDashboardProps {
  supplierData: SupplierData
}

// Polaris-aligned color palette for Recharts
const COLORS = {
  primary: "#008060",
  secondary: "#5C6AC4",
  tertiary: "#006FBB",
  critical: "#D82C0D",
  warning: "#FFC453",
  success: "#008060",
  subdued: "#6D7175",
  surface: "#F6F6F7",
  border: "#C9CCCF",
  blue: "#3b82f6",
  red: "#ef4444",
  orange: "#f97316",
}

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "white",
          border: `1px solid ${COLORS.border}`,
          borderRadius: "8px",
          padding: "12px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 600, marginBottom: "4px" }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: 0, color: entry.color, fontSize: "12px" }}>
            {entry.name}: {entry.value}
            {entry.name.includes("%") ? "" : entry.name.includes("Delivery") || entry.name.includes("Capacity") ? "%" : ""}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function SupplierOOSDashboard({ supplierData }: SupplierOOSDashboardProps) {
  const navigate = useNavigate()
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isCritical = supplierData.priority === "Critical"

  // Mock data for charts
  const supplierPerformanceData = [
    { month: "Sep", onTime: 94, quality: 4.8, capacity: 95 },
    { month: "Oct", onTime: 92, quality: 4.7, capacity: 88 },
    { month: "Nov", onTime: 89, quality: 4.6, capacity: 75 },
    { month: "Dec", onTime: 87, quality: 4.5, capacity: 62 },
    { month: "Jan", onTime: 85, quality: 4.4, capacity: 45 },
  ]

  const componentBreakdown = [
    { name: "Quest 3 128GB", shortage: 98, impact: 1200000 },
    { name: "Quest 3 512GB", shortage: 95, impact: 980000 },
    { name: "Quest Pro", shortage: 94, impact: 670000 },
  ]

  const alternativeSuppliers = [
    {
      name: "Pegatron Corporation",
      location: "Taiwan",
      capacity: "75% of required",
      leadTime: "14-21 days",
      qualityRating: 4.6,
      cost: "+15% premium",
      availability: "Available",
    },
    {
      name: "Wistron Corporation",
      location: "Taiwan",
      capacity: "60% of required",
      leadTime: "21-28 days",
      qualityRating: 4.4,
      cost: "+8% premium",
      availability: "Partial",
    },
    {
      name: "Compal Electronics",
      location: "Taiwan",
      capacity: "45% of required",
      leadTime: "28-35 days",
      qualityRating: 4.3,
      cost: "+12% premium",
      availability: "Limited",
    },
  ]

  const resolutionOptions = [
    {
      id: 1,
      title: "Emergency Supplier Activation",
      recommended: false,
      details: ["Activate backup supplier (Pegatron)", "Expedite tooling and setup", "Recovery time: 14-21 days"],
      cost: "$850,000",
      recoverySpeed: "Moderate",
      riskLevel: "Medium",
    },
    {
      id: 2,
      title: "Multi-Supplier Strategy",
      recommended: true,
      details: [
        "Split production across 2-3 suppliers",
        "Parallel qualification process",
        "Recovery time: 10-14 days",
      ],
      cost: "$1,200,000",
      recoverySpeed: "Fast",
      riskLevel: "Low",
    },
    {
      id: 3,
      title: "Design Modification",
      recommended: false,
      details: [
        "Modify component specifications",
        "Use alternative materials/processes",
        "Recovery time: 21-35 days",
      ],
      cost: "$2,100,000",
      recoverySpeed: "Slow",
      riskLevel: "High",
    },
  ]

  // Helper functions for badges
  const getPriorityBadge = (priority: string) => {
    const toneMap: Record<string, "critical" | "attention" | "info"> = {
      Critical: "critical",
      High: "attention",
      Medium: "info",
    }
    return toneMap[priority] || "info"
  }

  const getAvailabilityBadge = (availability: string) => {
    const toneMap: Record<string, "success" | "warning" | "attention"> = {
      Available: "success",
      Partial: "warning",
      Limited: "attention",
    }
    return toneMap[availability] || "info"
  }

  const getRecoverySpeedBadge = (speed: string) => {
    const toneMap: Record<string, "success" | "warning" | "attention"> = {
      Fast: "success",
      Moderate: "warning",
      Slow: "attention",
    }
    return toneMap[speed] || "info"
  }

  const getRiskLevelBadge = (risk: string) => {
    const toneMap: Record<string, "success" | "warning" | "critical"> = {
      Low: "success",
      Medium: "warning",
      High: "critical",
    }
    return toneMap[risk] || "warning"
  }

  const getBarColor = (value: number): string => {
    if (value >= 90) return COLORS.critical
    if (value >= 70) return COLORS.warning
    return COLORS.orange
  }

  const selectedResolutionOption = resolutionOptions.find((o) => o.id === selectedOption)

  return (
    <Page
      title={`Supplier OOS Alert: ${supplierData.componentType}`}
      backAction={{
        content: "Supplier Alerts",
        onAction: () => navigate("/inv/supplier-alerts"),
      }}
      titleMetadata={
        <InlineStack gap="200">
          <Badge tone={getPriorityBadge(supplierData.priority)}>{supplierData.priority} Priority</Badge>
          <Badge>{supplierData.alertType}</Badge>
        </InlineStack>
      }
    >
      <BlockStack gap="400">
        {/* Critical Alert Banner */}
        {isCritical && (
          <Banner tone="critical" icon={AlertTriangleIcon}>
            <Text as="p" fontWeight="semibold">
              CRITICAL SUPPLIER ALERT: {supplierData.supplierName} - {supplierData.componentType} Production Severely
              Impacted
            </Text>
          </Banner>
        )}

        <Layout>
          <Layout.Section>
            <BlockStack gap="400">
              {/* Key Metrics Cards */}
              <InlineStack gap="400" wrap={false}>
                <div style={{ flex: 1 }}>
                  <Card>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        Current Stock Level
                      </Text>
                      <InlineStack align="center" blockAlign="center" gap="200">
                        <Text as="h2" variant="heading2xl" alignment="center" tone="critical">
                          {((supplierData.currentStock / supplierData.requiredStock) * 100).toFixed(0)}%
                        </Text>
                        <Badge tone="critical">-{supplierData.shortagePercentage.toFixed(0)}%</Badge>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        Severely below required
                      </Text>
                    </BlockStack>
                  </Card>
                </div>

                <div style={{ flex: 1 }}>
                  <Card>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        Estimated Recovery
                      </Text>
                      <InlineStack align="center" blockAlign="center" gap="100">
                        <div style={{ width: "20px", height: "20px" }}>
                          <ClockIcon />
                        </div>
                        <Text as="h2" variant="heading2xl" alignment="center" tone="warning">
                          {supplierData.estimatedRecovery}
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        Without intervention
                      </Text>
                    </BlockStack>
                  </Card>
                </div>

                <div style={{ flex: 1 }}>
                  <Card>
                    <BlockStack gap="200">
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        Affected SKUs
                      </Text>
                      <InlineStack align="center" blockAlign="center" gap="100">
                        <div style={{ width: "20px", height: "20px" }}>
                          <PackageIcon />
                        </div>
                        <Text as="h2" variant="heading2xl" alignment="center">
                          {supplierData.affectedSKUs}
                        </Text>
                      </InlineStack>
                      <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                        VR headset models
                      </Text>
                    </BlockStack>
                  </Card>
                </div>
              </InlineStack>

              {/* Alert Details & Impact Analysis */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Alert Details & Impact Analysis
                    </Text>
                    <div style={{ width: "16px", height: "16px" }}>
                      <AlertTriangleIcon />
                    </div>
                  </InlineStack>

                  <Text as="p" variant="bodyMd">
                    {supplierData.supplierName} has experienced a {supplierData.supplierStatus.toLowerCase()} affecting{" "}
                    {supplierData.componentType} production. Current stock levels are at{" "}
                    {supplierData.currentStock.toLocaleString()} units, representing a{" "}
                    {supplierData.shortagePercentage.toFixed(1)}% shortage from required levels of{" "}
                    {supplierData.requiredStock.toLocaleString()} units.
                  </Text>

                  <InlineStack gap="400" wrap={false}>
                    <div style={{ flex: 1 }}>
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm" fontWeight="semibold">
                          Financial Impact
                        </Text>
                        <BlockStack gap="100">
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodySm" tone="subdued">
                              Estimated Revenue Loss:
                            </Text>
                            <Text as="span" variant="bodySm" fontWeight="semibold">
                              ${(supplierData.estimatedImpact / 1000000).toFixed(2)}M
                            </Text>
                          </InlineStack>
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodySm" tone="subdued">
                              Contract Value:
                            </Text>
                            <Text as="span" variant="bodySm" fontWeight="semibold">
                              ${(supplierData.contractValue / 1000000).toFixed(0)}M
                            </Text>
                          </InlineStack>
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodySm" tone="subdued">
                              Units Short:
                            </Text>
                            <Text as="span" variant="bodySm" fontWeight="semibold">
                              {(supplierData.requiredStock - supplierData.currentStock).toLocaleString()}
                            </Text>
                          </InlineStack>
                        </BlockStack>
                      </BlockStack>
                    </div>

                    <div style={{ flex: 1 }}>
                      <BlockStack gap="200">
                        <Text as="h3" variant="headingSm" fontWeight="semibold">
                          Supplier Performance
                        </Text>
                        <BlockStack gap="100">
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodySm" tone="subdued">
                              Quality Rating:
                            </Text>
                            <Text as="span" variant="bodySm" fontWeight="semibold">
                              {supplierData.qualityRating}/5.0
                            </Text>
                          </InlineStack>
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodySm" tone="subdued">
                              On-Time Delivery:
                            </Text>
                            <Text as="span" variant="bodySm" fontWeight="semibold">
                              {supplierData.onTimeDelivery}%
                            </Text>
                          </InlineStack>
                          <InlineStack align="space-between">
                            <Text as="span" variant="bodySm" tone="subdued">
                              Current Status:
                            </Text>
                            <Badge tone="critical">{supplierData.supplierStatus}</Badge>
                          </InlineStack>
                        </BlockStack>
                      </BlockStack>
                    </div>
                  </InlineStack>
                </BlockStack>
              </Card>

              {/* Component Shortage & Performance Trend */}
              <InlineStack gap="400" wrap={false}>
                <div style={{ flex: 1 }}>
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <LegacyStack vertical spacing="extraTight">
                          <Text as="h2" variant="headingMd">
                            Component Shortage Breakdown
                          </Text>
                          <Badge tone="critical">{supplierData.shortagePercentage.toFixed(1)}% overall shortage</Badge>
                        </LegacyStack>
                        <div style={{ width: "16px", height: "16px" }}>
                          <AlertTriangleIcon />
                        </div>
                      </InlineStack>

                      <BlockStack gap="300">
                        {componentBreakdown.map((component, index) => (
                          <BlockStack gap="100" key={index}>
                            <InlineStack align="space-between">
                              <Text as="span" variant="bodySm">
                                {component.name}
                              </Text>
                              <Text as="span" variant="bodySm" tone="subdued">
                                {component.shortage}% shortage
                              </Text>
                            </InlineStack>
                            <ProgressBar progress={component.shortage} size="small" tone="critical" />
                            <Text as="p" variant="bodySm" tone="subdued">
                              Impact: ${(component.impact / 1000000).toFixed(1)}M
                            </Text>
                          </BlockStack>
                        ))}
                      </BlockStack>

                      {/* Bar Chart for Component Shortage */}
                      <Box paddingBlockStart="200">
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={componentBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                            <XAxis dataKey="name" tick={{ fontSize: 10, fill: COLORS.subdued }} angle={-15} textAnchor="end" height={60} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.subdued }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="shortage" name="Shortage %">
                              {componentBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getBarColor(entry.shortage)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    </BlockStack>
                  </Card>
                </div>

                <div style={{ flex: 1 }}>
                  <Card>
                    <BlockStack gap="400">
                      <InlineStack align="space-between" blockAlign="center">
                        <Text as="h2" variant="headingMd">
                          Supplier Performance Trend
                        </Text>
                        <div style={{ width: "16px", height: "16px" }}>
                          <ChartVerticalIcon />
                        </div>
                      </InlineStack>

                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={supplierPerformanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: COLORS.subdued }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: COLORS.subdued }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ fontSize: "11px" }} />
                          <Line
                            type="monotone"
                            dataKey="onTime"
                            stroke={COLORS.blue}
                            strokeWidth={2}
                            dot={{ fill: COLORS.blue, r: 4 }}
                            name="On-Time Delivery %"
                          />
                          <Line
                            type="monotone"
                            dataKey="capacity"
                            stroke={COLORS.critical}
                            strokeWidth={2}
                            dot={{ fill: COLORS.critical, r: 4 }}
                            name="Capacity %"
                          />
                        </LineChart>
                      </ResponsiveContainer>

                      <InlineStack gap="400" wrap={false}>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <Text as="p" variant="bodySm" tone="subdued">
                            On-Time Delivery
                          </Text>
                          <Text as="p" variant="headingLg" tone="critical">
                            85%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            -9% decline
                          </Text>
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Capacity Utilization
                          </Text>
                          <Text as="p" variant="headingLg" tone="critical">
                            45%
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            -50% decline
                          </Text>
                        </div>
                      </InlineStack>
                    </BlockStack>
                  </Card>
                </div>
              </InlineStack>

              {/* Alternative Suppliers */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Alternative Supplier Options
                    </Text>
                    <div style={{ width: "16px", height: "16px" }}>
                      <LocationIcon />
                    </div>
                  </InlineStack>

                  <BlockStack gap="300">
                    {alternativeSuppliers.map((supplier, index) => (
                      <Box
                        key={index}
                        padding="400"
                        borderColor="border"
                        borderWidth="025"
                        borderRadius="200"
                        background="bg-surface"
                      >
                        <BlockStack gap="300">
                          <InlineStack align="space-between" blockAlign="center">
                            <Text as="h3" variant="headingSm" fontWeight="semibold">
                              {supplier.name}
                            </Text>
                            <Badge tone={getAvailabilityBadge(supplier.availability)}>{supplier.availability}</Badge>
                          </InlineStack>

                          <InlineStack gap="400" wrap>
                            <div style={{ minWidth: "120px" }}>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Location
                              </Text>
                              <Text as="p" variant="bodySm" fontWeight="semibold">
                                {supplier.location}
                              </Text>
                            </div>
                            <div style={{ minWidth: "120px" }}>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Capacity
                              </Text>
                              <Text as="p" variant="bodySm" fontWeight="semibold">
                                {supplier.capacity}
                              </Text>
                            </div>
                            <div style={{ minWidth: "120px" }}>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Lead Time
                              </Text>
                              <Text as="p" variant="bodySm" fontWeight="semibold">
                                {supplier.leadTime}
                              </Text>
                            </div>
                            <div style={{ minWidth: "120px" }}>
                              <Text as="p" variant="bodySm" tone="subdued">
                                Quality Rating
                              </Text>
                              <InlineStack gap="100" blockAlign="center">
                                <div style={{ width: "14px", height: "14px" }}>
                                  <StarFilledIcon />
                                </div>
                                <Text as="span" variant="bodySm" fontWeight="semibold">
                                  {supplier.qualityRating}
                                </Text>
                              </InlineStack>
                            </div>
                          </InlineStack>

                          <InlineStack gap="100">
                            <Text as="span" variant="bodySm" tone="subdued">
                              Cost Impact:
                            </Text>
                            <Text as="span" variant="bodySm" fontWeight="semibold">
                              {supplier.cost}
                            </Text>
                          </InlineStack>
                        </BlockStack>
                      </Box>
                    ))}
                  </BlockStack>
                </BlockStack>
              </Card>

              {/* Resolution Options */}
              <Card>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <Text as="h2" variant="headingMd">
                      Resolution Options
                    </Text>
                    <div style={{ width: "16px", height: "16px" }}>
                      <CheckCircleIcon />
                    </div>
                  </InlineStack>

                  <InlineStack gap="400" wrap>
                    {resolutionOptions.map((option) => (
                      <div key={option.id} style={{ flex: "1 1 300px", minWidth: "250px" }}>
                        <Box
                          padding="400"
                          borderColor={option.recommended ? "border-brand" : "border"}
                          borderWidth="025"
                          borderRadius="200"
                          background={option.recommended ? "bg-surface-brand" : "bg-surface"}
                        >
                          <BlockStack gap="300">
                            <BlockStack gap="100">
                              <Text as="h3" variant="headingSm" fontWeight="semibold">
                                {option.title}
                              </Text>
                              {option.recommended && <Badge tone="info">Recommended</Badge>}
                            </BlockStack>

                            <BlockStack gap="050">
                              {option.details.map((detail, index) => (
                                <Text as="p" variant="bodySm" tone="subdued" key={index}>
                                  {detail}
                                </Text>
                              ))}
                            </BlockStack>

                            <BlockStack gap="100">
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Cost:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="semibold">
                                  {option.cost}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Recovery Speed:
                                </Text>
                                <Badge tone={getRecoverySpeedBadge(option.recoverySpeed)}>{option.recoverySpeed}</Badge>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Risk Level:
                                </Text>
                                <Badge tone={getRiskLevelBadge(option.riskLevel)}>{option.riskLevel}</Badge>
                              </InlineStack>
                            </BlockStack>

                            <Button
                              variant={option.recommended ? "primary" : "secondary"}
                              size="slim"
                              fullWidth
                              onClick={() => {
                                setSelectedOption(option.id)
                                setIsModalOpen(true)
                              }}
                            >
                              Select Option
                            </Button>
                          </BlockStack>
                        </Box>
                      </div>
                    ))}
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>

          {/* Sidebar */}
          <Layout.Section variant="oneThird">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Supplier Information
                </Text>
                <Divider />

                <BlockStack gap="300">
                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Supplier Name
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {supplierData.supplierName}
                    </Text>
                  </div>

                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Location
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {supplierData.location}
                    </Text>
                  </div>

                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Component Type
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {supplierData.componentType}
                    </Text>
                  </div>

                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Contract Value
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      ${(supplierData.contractValue / 1000000).toFixed(0)}M annually
                    </Text>
                  </div>

                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Quality Rating
                    </Text>
                    <InlineStack gap="100" blockAlign="center">
                      <div style={{ width: "16px", height: "16px" }}>
                        <StarFilledIcon />
                      </div>
                      <Text as="span" variant="bodyMd" fontWeight="semibold">
                        {supplierData.qualityRating}/5.0
                      </Text>
                    </InlineStack>
                  </div>

                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      On-Time Delivery
                    </Text>
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {supplierData.onTimeDelivery}%
                    </Text>
                    <Box paddingBlockStart="100">
                      <ProgressBar progress={supplierData.onTimeDelivery} size="small" tone="success" />
                    </Box>
                  </div>

                  <div>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Current Status
                    </Text>
                    <Box paddingBlockStart="100">
                      <Badge tone="critical">{supplierData.supplierStatus}</Badge>
                    </Box>
                  </div>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>

      {/* Modal for resolution confirmation */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Implement ${selectedResolutionOption?.title}?`}
        primaryAction={{
          content: "Confirm Implementation",
          onAction: () => {
            setIsModalOpen(false)
            // Add implementation logic here
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodyMd">
            This action will initiate the selected recovery plan. Please confirm to proceed with implementation.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
