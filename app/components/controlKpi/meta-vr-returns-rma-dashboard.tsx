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
  ProgressBar,
  Modal,
  FormLayout,
  TextField,
  Select,
} from "@shopify/polaris"
import {
  AlertTriangleIcon,
  PackageIcon,
  ChartVerticalIcon,
  ClockIcon,
  StarFilledIcon,
  PersonIcon,
  NoteIcon,
  RefreshIcon,
  CheckCircleIcon,
  // ToolsIcon, // Removed because it is not exported by @shopify/polaris-icons
} from "@shopify/polaris-icons"

interface RMAData {
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

interface ReturnsRMADashboardProps {
  rmaData: RMAData
}

export default function ReturnsRMADashboard({ rmaData }: ReturnsRMADashboardProps) {
  const [selectedTab, setSelectedTab] = useState(0)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isModalActive, setIsModalActive] = useState(false)

  const isCritical = rmaData.priority === "Critical"

  // Mock data for charts and analysis
  const returnTrendData = [
    { week: "Week 1", returns: 180, rate: 2.1 },
    { week: "Week 2", returns: 245, rate: 3.2 },
    { week: "Week 3", returns: 320, rate: 4.8 },
    { week: "Week 4", returns: 485, rate: 6.9 },
    { week: "Week 5", returns: 650, rate: 8.5 },
  ]

  const defectBreakdown = [
    { category: "Display Issues", count: 450, percentage: 36 },
    { category: "Controller Problems", count: 320, percentage: 26 },
    { category: "Audio Defects", count: 280, percentage: 22 },
    { category: "Tracking Issues", count: 200, percentage: 16 },
  ]

  const batchAnalysis = [
    { batch: "QB3-2024-Q4-001", returns: 1250, rate: 8.5, status: "Critical" },
    { batch: "QB3-2024-Q3-008", returns: 890, rate: 6.2, status: "High" },
    { batch: "QB3-2024-Q3-005", returns: 650, rate: 4.8, status: "Medium" },
    { batch: "QB3-2024-Q2-012", returns: 420, rate: 3.1, status: "Low" },
  ]

  const resolutionActions = [
    {
      id: 1,
      title: "Immediate Recall & Replacement",
      recommended: false,
      details: [
        "Initiate voluntary recall for affected batch",
        "Provide immediate replacements",
        "Recovery time: 2-3 weeks",
      ],
      cost: "$2,850,000",
      customerImpact: "High Satisfaction",
      riskLevel: "Low",
    },
    {
      id: 2,
      title: "Targeted Quality Fix",
      recommended: true,
      details: [
        "Implement quality fix for root cause",
        "Offer repair service for existing units",
        "Recovery time: 1-2 weeks",
      ],
      cost: "$1,200,000",
      customerImpact: "Moderate Satisfaction",
      riskLevel: "Medium",
    },
    {
      id: 3,
      title: "Software Update Solution",
      recommended: false,
      details: [
        "Deploy software patch to mitigate issue",
        "Monitor effectiveness over time",
        "Recovery time: 3-5 days",
      ],
      cost: "$450,000",
      customerImpact: "Variable Satisfaction",
      riskLevel: "High",
    },
  ]

  const rmaProcessSteps = [
    { step: "Customer Report", status: "Completed", date: "Jan 10, 2025" },
    { step: "Initial Assessment", status: "Completed", date: "Jan 12, 2025" },
    { step: "Defect Analysis", status: "In Progress", date: "Jan 15, 2025" },
    { step: "Root Cause Investigation", status: "Pending", date: "Jan 18, 2025" },
    { step: "Resolution Implementation", status: "Pending", date: "Jan 22, 2025" },
    { step: "Customer Communication", status: "Pending", date: "Jan 25, 2025" },
  ]

  const handleTabChange = useCallback((selectedTabIndex: number) => {
    setSelectedTab(selectedTabIndex)
  }, [])

  const getPriorityBadge = (priority: string) => {
    if (priority === "Critical") return <Badge tone="critical">Critical Priority</Badge>
    if (priority === "High") return <Badge tone="warning">High Priority</Badge>
    return <Badge tone="info">{`${priority} Priority`}</Badge>
  }

  const getStatusBadge = (status: string) => {
    if (status === "Critical") return <Badge tone="critical">Critical</Badge>
    if (status === "High") return <Badge tone="warning">High</Badge>
    if (status === "Medium") return <Badge tone="attention">Medium</Badge>
    return <Badge tone="info">Low</Badge>
  }

  const tabs = [
    { id: "overview", content: "Overview", panelID: "overview-panel" },
    { id: "analysis", content: "Defect Analysis", panelID: "analysis-panel" },
    { id: "process", content: "RMA Process", panelID: "process-panel" },
    { id: "resolution", content: "Resolution", panelID: "resolution-panel" },
    { id: "impact", content: "Impact Assessment", panelID: "impact-panel" },
  ]

  return (
    <Page
      fullWidth
      title={`RMA Alert: ${rmaData.returnReason}`}
      subtitle={`${rmaData.productModel} • RMA ${rmaData.rmaNumber} • ${rmaData.region}`}
      backAction={{ content: "Back to Returns & RMA", url: "/inv/cusRecipt" }}
      titleMetadata={
        <InlineStack gap="200">
          {getPriorityBadge(rmaData.priority)}
          <Badge tone="info">{rmaData.alertType}</Badge>
        </InlineStack>
      }
    >
      <Layout>
        {/* Critical Alert Banner */}
        {isCritical && (
          <Layout.Section>
            <Banner
              title={`CRITICAL RMA ALERT: ${rmaData.productModel} - ${rmaData.returnReason} (${rmaData.returnRate}% Return Rate)`}
              tone="critical"
              icon={AlertTriangleIcon}
            />
          </Layout.Section>
        )}

        {/* Key Metrics */}
        <Layout.Section>
          <InlineStack gap="400" wrap>
            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Return Rate
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <ChartVerticalIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold" tone="critical">
                    {rmaData.returnRate}%
                  </Text>
                  <Badge tone="critical">High</Badge>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Above 5% threshold
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Processing Time
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <ClockIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold" tone="critical">
                    {rmaData.processingTime}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Current estimate
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Return Quantity
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <PackageIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    {rmaData.returnQuantity.toLocaleString()}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    units affected
                  </Text>
                </BlockStack>
              </Card>
            </Box>

            <Box minWidth="200px">
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Quality Score
                    </Text>
                    <div style={{ width: '16px', height: '16px' }}>
                      <StarFilledIcon />
                    </div>
                  </InlineStack>
                  <Text as="h3" variant="headingLg" fontWeight="bold" tone="critical">
                    {rmaData.qualityScore}
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    out of 5.0
                  </Text>
                </BlockStack>
              </Card>
            </Box>
          </InlineStack>
        </Layout.Section>

        {/* Main Content */}
        <Layout.Section>
          <Layout>
            <Layout.Section variant="oneThird">
              {/* RMA Information Sidebar */}
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h3">
                    RMA Information
                  </Text>

                  <BlockStack gap="300">
                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        RMA Number
                      </Text>
                      <Text variant="bodyMd" fontWeight="medium" as="span">
                        {rmaData.rmaNumber}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Product Model
                      </Text>
                      <Text variant="bodyMd" fontWeight="medium" as="span">
                        {rmaData.productModel}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Return Reason
                      </Text>
                      <Text variant="bodyMd" fontWeight="medium" as="span">
                        {rmaData.returnReason}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Defect Category
                      </Text>
                      <Text variant="bodyMd" fontWeight="medium" as="span">
                        {rmaData.defectCategory}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Customer Type
                      </Text>
                      <Text variant="bodyMd" fontWeight="medium" as="span">
                        {rmaData.customerType}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Region
                      </Text>
                      <Text variant="bodyMd" fontWeight="medium" as="span">
                        {rmaData.region}
                      </Text>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Warranty Status
                      </Text>
                      <Badge tone="info">{rmaData.warrantyStatus}</Badge>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Resolution Status
                      </Text>
                      <Badge tone="attention">{rmaData.resolutionStatus}</Badge>
                    </BlockStack>

                    <BlockStack gap="050">
                      <Text variant="bodySm" tone="subdued" as="span">
                        Due Date
                      </Text>
                      <Text variant="bodyMd" fontWeight="medium" as="span">
                        {rmaData.dueDate}
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </BlockStack>
              </Card>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
                  <Box padding="400">
                    {selectedTab === 0 && (
                      <Layout>
                        {/* Alert Details */}
                        <Layout.Section>
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  RMA Alert Details & Analysis
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  <AlertTriangleIcon />
                                </div>
                              </InlineStack>

                              <Text as="p" variant="bodyMd">
                                RMA {rmaData.rmaNumber} has been triggered due to {rmaData.returnReason.toLowerCase()} issues
                                affecting {rmaData.productModel}. Current return rate of {rmaData.returnRate}% significantly
                                exceeds the acceptable threshold of 5%, with {rmaData.returnQuantity.toLocaleString()} units
                                affected from batch {rmaData.batchNumber}.
                              </Text>

                              <Layout>
                                <Layout.Section variant="oneHalf">
                                  <Card background="bg-surface-secondary">
                                    <BlockStack gap="200">
                                      <Text variant="headingSm" as="h4">
                                        Financial Impact
                                      </Text>
                                      <BlockStack gap="100">
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Estimated Cost:
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            ${(rmaData.estimatedCost / 1000000).toFixed(2)}M
                                          </Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Warranty Status:
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            {rmaData.warrantyStatus}
                                          </Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Customer Type:
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            {rmaData.customerType}
                                          </Text>
                                        </InlineStack>
                                      </BlockStack>
                                    </BlockStack>
                                  </Card>
                                </Layout.Section>

                                <Layout.Section variant="oneHalf">
                                  <Card background="bg-surface-secondary">
                                    <BlockStack gap="200">
                                      <Text variant="headingSm" as="h4">
                                        Product Information
                                      </Text>
                                      <BlockStack gap="100">
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Batch Number:
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            {rmaData.batchNumber}
                                          </Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Manufacturing Date:
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            {rmaData.manufacturingDate}
                                          </Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Supplier Impact:
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            {rmaData.supplierImpact}
                                          </Text>
                                        </InlineStack>
                                      </BlockStack>
                                    </BlockStack>
                                  </Card>
                                </Layout.Section>
                              </Layout>
                            </BlockStack>
                          </Card>
                        </Layout.Section>

                        {/* Return Trend Chart */}
                        <Layout.Section variant="oneHalf">
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  Return Rate Trend
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  <ChartVerticalIcon />
                                </div>
                              </InlineStack>

                              <BlockStack gap="300">
                                {returnTrendData.map((week, index) => {
                                  const maxRate = Math.max(...returnTrendData.map(w => w.rate))
                                  const ratePercentage = (week.rate / maxRate) * 100

                                  return (
                                    <BlockStack key={index} gap="100">
                                      <InlineStack align="space-between">
                                        <Text variant="bodySm" fontWeight="medium" as="span">
                                          {week.week}
                                        </Text>
                                        <InlineStack gap="300">
                                          <Text variant="bodySm" as="span">
                                            {week.returns} returns
                                          </Text>
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            {week.rate}%
                                          </Text>
                                        </InlineStack>
                                      </InlineStack>
                                      <ProgressBar
                                        progress={ratePercentage}
                                        size="medium"
                                        tone="critical"
                                      />
                                    </BlockStack>
                                  )
                                })}
                              </BlockStack>

                              <Banner tone="critical">
                                <BlockStack gap="100">
                                  <Text as="p" variant="bodyMd" fontWeight="bold">
                                    Current Trend: +305% increase
                                  </Text>
                                  <Text as="p" variant="bodySm">
                                    over 5 weeks
                                  </Text>
                                </BlockStack>
                              </Banner>
                            </BlockStack>
                          </Card>
                        </Layout.Section>

                        {/* Defect Breakdown */}
                        <Layout.Section variant="oneHalf">
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  Defect Category Breakdown
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  <PackageIcon />
                                </div>
                              </InlineStack>

                              <BlockStack gap="300">
                                {defectBreakdown.map((defect, index) => (
                                  <BlockStack key={index} gap="100">
                                    <InlineStack align="space-between">
                                      <Text variant="bodySm" fontWeight="medium" as="span">
                                        {defect.category}
                                      </Text>
                                      <Text variant="bodySm" tone="subdued" as="span">
                                        {defect.count} units ({defect.percentage}%)
                                      </Text>
                                    </InlineStack>
                                    <ProgressBar
                                      progress={defect.percentage}
                                      size="small"
                                      tone="primary"
                                    />
                                  </BlockStack>
                                ))}
                              </BlockStack>
                            </BlockStack>
                          </Card>
                        </Layout.Section>
                      </Layout>
                    )}

                    {selectedTab === 1 && (
                      <Layout>
                        <Layout.Section>
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  Batch Analysis & Root Cause
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  <NoteIcon />
                                </div>
                              </InlineStack>

                              <Banner tone="critical" title="Root Cause Analysis">
                                <BlockStack gap="200">
                                  <Text as="p" variant="bodyMd">
                                    Primary root cause identified as: <strong>{rmaData.rootCause}</strong>
                                  </Text>
                                  <Text as="p" variant="bodySm">
                                    Investigation shows quality control issues during manufacturing process at{" "}
                                    {rmaData.supplierImpact} facility. Defect appears to be systematic across the entire batch{" "}
                                    {rmaData.batchNumber}.
                                  </Text>
                                </BlockStack>
                              </Banner>

                              <BlockStack gap="300">
                                <Text variant="headingSm" as="h4">
                                  Affected Batch Comparison
                                </Text>
                                {batchAnalysis.map((batch, index) => (
                                  <Card key={index} background="bg-surface-secondary">
                                    <BlockStack gap="200">
                                      <InlineStack align="space-between">
                                        <Text variant="bodyMd" fontWeight="medium" as="span">
                                          {batch.batch}
                                        </Text>
                                        {getStatusBadge(batch.status)}
                                      </InlineStack>
                                      <InlineStack gap="400">
                                        <BlockStack gap="050">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Returns
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            {batch.returns.toLocaleString()}
                                          </Text>
                                        </BlockStack>
                                        <BlockStack gap="050">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Rate
                                          </Text>
                                          <Text variant="bodyMd" fontWeight="medium" as="span">
                                            {batch.rate}%
                                          </Text>
                                        </BlockStack>
                                      </InlineStack>
                                    </BlockStack>
                                  </Card>
                                ))}
                              </BlockStack>
                            </BlockStack>
                          </Card>
                        </Layout.Section>
                      </Layout>
                    )}

                    {selectedTab === 2 && (
                      <Layout>
                        <Layout.Section>
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  RMA Process Timeline
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  <RefreshIcon />
                                </div>
                              </InlineStack>

                              <BlockStack gap="300">
                                {rmaProcessSteps.map((step, index) => (
                                  <InlineStack key={index} gap="300" blockAlign="start">
                                    <Box
                                      background={
                                        step.status === "Completed"
                                          ? "bg-fill-success"
                                          : step.status === "In Progress"
                                          ? "bg-fill-info"
                                          : "bg-fill-disabled"
                                      }
                                      minWidth="16px"
                                      minHeight="16px"
                                      borderRadius="full"
                                    />
                                    <BlockStack gap="100">
                                      <InlineStack align="space-between" blockAlign="center">
                                        <Text variant="bodyMd" fontWeight="medium" as="span">
                                          {step.step}
                                        </Text>
                                        <Text variant="bodySm" tone="subdued" as="span">
                                          {step.date}
                                        </Text>
                                      </InlineStack>
                                      <Badge
                                        tone={
                                          step.status === "Completed"
                                            ? "success"
                                            : step.status === "In Progress"
                                            ? "info"
                                            : undefined
                                        }
                                      >
                                        {step.status}
                                      </Badge>
                                    </BlockStack>
                                  </InlineStack>
                                ))}
                              </BlockStack>
                            </BlockStack>
                          </Card>
                        </Layout.Section>
                      </Layout>
                    )}

                    {selectedTab === 3 && (
                      <Layout>
                        <Layout.Section>
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  Resolution Action Plans
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  <CheckCircleIcon />
                                </div>
                              </InlineStack>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                {resolutionActions.map((action) => (
                                  <Card
                                    key={action.id}
                                    background={action.recommended ? "bg-surface-info" : undefined}
                                  >
                                    <BlockStack gap="300">
                                      <BlockStack gap="100">
                                        <Text variant="headingSm" as="h4">
                                          {action.title}
                                        </Text>
                                        {action.recommended && (
                                          <Badge tone="success">Recommended</Badge>
                                        )}
                                      </BlockStack>

                                      <BlockStack gap="100">
                                        {action.details.map((detail, index) => (
                                          <Text key={index} variant="bodySm" as="p">
                                            • {detail}
                                          </Text>
                                        ))}
                                      </BlockStack>

                                      <BlockStack gap="200">
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Cost:
                                          </Text>
                                          <Text variant="bodySm" fontWeight="medium" as="span">
                                            {action.cost}
                                          </Text>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Customer Impact:
                                          </Text>
                                          <Badge
                                            tone={
                                              action.customerImpact === "High Satisfaction"
                                                ? "success"
                                                : action.customerImpact === "Moderate Satisfaction"
                                                ? "info"
                                                : undefined
                                            }
                                          >
                                            {action.customerImpact}
                                          </Badge>
                                        </InlineStack>
                                        <InlineStack align="space-between">
                                          <Text variant="bodySm" tone="subdued" as="span">
                                            Risk Level:
                                          </Text>
                                          <Badge
                                            tone={
                                              action.riskLevel === "Low"
                                                ? "success"
                                                : action.riskLevel === "Medium"
                                                ? "attention"
                                                : "critical"
                                            }
                                          >
                                            {action.riskLevel}
                                          </Badge>
                                        </InlineStack>
                                      </BlockStack>

                                      <Button
                                        variant={action.recommended ? "primary" : "secondary"}
                                        onClick={() => {
                                          setSelectedOption(action.id)
                                          setIsModalActive(true)
                                        }}
                                      >
                                        Select Action
                                      </Button>
                                    </BlockStack>
                                  </Card>
                                ))}
                              </div>
                            </BlockStack>
                          </Card>
                        </Layout.Section>
                      </Layout>
                    )}

                    {selectedTab === 4 && (
                      <Layout>
                        <Layout.Section variant="oneHalf">
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  Customer Impact Analysis
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  <PersonIcon />
                                </div>
                              </InlineStack>

                              <InlineStack gap="300">
                                <Card background="bg-surface-critical">
                                  <BlockStack gap="100">
                                    <Text variant="bodySm" tone="subdued" as="span">
                                      Customer Satisfaction
                                    </Text>
                                    <Text variant="heading2xl" fontWeight="bold" as="p">
                                      {rmaData.qualityScore}/5.0
                                    </Text>
                                    <Text variant="bodySm" tone="critical" as="span">
                                      -1.8 point decline
                                    </Text>
                                  </BlockStack>
                                </Card>

                                <Card background="bg-surface-warning">
                                  <BlockStack gap="100">
                                    <Text variant="bodySm" tone="subdued" as="span">
                                      Brand Impact
                                    </Text>
                                    <Text variant="heading2xl" fontWeight="bold" as="p">
                                      High
                                    </Text>
                                    <Text variant="bodySm" tone="critical" as="span">
                                      reputation risk
                                    </Text>
                                  </BlockStack>
                                </Card>
                              </InlineStack>

                              <BlockStack gap="200">
                                <Text variant="headingSm" as="h4">
                                  Key Impact Areas
                                </Text>
                                <BlockStack gap="100">
                                  <Text variant="bodySm" as="p">
                                    • Customer trust and loyalty degradation
                                  </Text>
                                  <Text variant="bodySm" as="p">
                                    • Increased support ticket volume (+45%)
                                  </Text>
                                  <Text variant="bodySm" as="p">
                                    • Potential media coverage and PR issues
                                  </Text>
                                  <Text variant="bodySm" as="p">
                                    • Retailer relationship strain
                                  </Text>
                                </BlockStack>
                              </BlockStack>
                            </BlockStack>
                          </Card>
                        </Layout.Section>

                        <Layout.Section variant="oneHalf">
                          <Card>
                            <BlockStack gap="400">
                              <InlineStack align="space-between">
                                <Text variant="headingMd" as="h3">
                                  Operational Impact
                                </Text>
                                <div style={{ width: '16px', height: '16px' }}>
                                  {/* FIX: ToolsIcon not found, replacing with emoji as placeholder */}
                                  <span role="img" aria-label="tools">🛠️</span>
                                </div>
                              </InlineStack>

                              <InlineStack gap="300">
                                <Card background="bg-surface-info">
                                  <BlockStack gap="100">
                                    <Text variant="bodySm" tone="subdued" as="span">
                                      Processing Capacity
                                    </Text>
                                    <Text variant="heading2xl" fontWeight="bold" as="p">
                                      85%
                                    </Text>
                                    <Text variant="bodySm" as="span">
                                      of normal capacity
                                    </Text>
                                  </BlockStack>
                                </Card>

                                <Card background="bg-surface-secondary">
                                  <BlockStack gap="100">
                                    <Text variant="bodySm" tone="subdued" as="span">
                                      Resource Allocation
                                    </Text>
                                    <Text variant="heading2xl" fontWeight="bold" as="p">
                                      +60%
                                    </Text>
                                    <Text variant="bodySm" as="span">
                                      additional resources
                                    </Text>
                                  </BlockStack>
                                </Card>
                              </InlineStack>

                              <BlockStack gap="200">
                                <Text variant="headingSm" as="h4">
                                  Operational Challenges
                                </Text>
                                <BlockStack gap="100">
                                  <Text variant="bodySm" as="p">
                                    • Increased RMA processing workload
                                  </Text>
                                  <Text variant="bodySm" as="p">
                                    • Quality assurance team overload
                                  </Text>
                                  <Text variant="bodySm" as="p">
                                    • Supplier relationship management
                                  </Text>
                                  <Text variant="bodySm" as="p">
                                    • Inventory management complexity
                                  </Text>
                                </BlockStack>
                              </BlockStack>
                            </BlockStack>
                          </Card>
                        </Layout.Section>
                      </Layout>
                    )}
                  </Box>
                </Tabs>
              </Card>
            </Layout.Section>
          </Layout>
        </Layout.Section>
      </Layout>

      {/* Resolution Action Modal */}
      <Modal
        open={isModalActive}
        onClose={() => setIsModalActive(false)}
        title={`Implement ${resolutionActions.find((a) => a.id === selectedOption)?.title}?`}
        primaryAction={{
          content: 'Confirm Implementation',
          onAction: () => setIsModalActive(false),
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => setIsModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <Text as="p" variant="bodyMd">
            This action will initiate the selected resolution plan for RMA {rmaData.rmaNumber}. Please confirm to
            proceed with implementation.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
