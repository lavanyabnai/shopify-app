import { useState } from "react"
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
  DataTable,
  Modal,
  TextField,
} from "@shopify/polaris"
import {
  PackageIcon,
  AlertCircleIcon,
  ClockIcon,
  CalendarIcon,
} from "@shopify/polaris-icons"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import type {
  OrderPerformanceAlert,
  OrderLineItem,
  PeggingDetail,
  AlternateProposal,
  LearningData,
} from "../../../services/order-performance.server"

interface OrderPerformanceDetailProps {
  alert: OrderPerformanceAlert
  lineItems: OrderLineItem[]
  peggingDetails: PeggingDetail[]
  alternateProposals: AlternateProposal[]
  learningData?: LearningData
}

export default function OrderPerformanceDetail({
  alert,
  lineItems,
  peggingDetails,
  alternateProposals,
  learningData,
}: OrderPerformanceDetailProps) {
  const [selectedTab, setSelectedTab] = useState(0)
  const [isConfirmModalActive, setIsConfirmModalActive] = useState(false)
  const [isReportModalActive, setIsReportModalActive] = useState(false)
  const [maxDelay, setMaxDelay] = useState("5")
  const [maxPalletCut, setMaxPalletCut] = useState("10")

  const tabs = [
    { id: "atp-details", content: "ATP Details", panelID: "atp-details-panel" },
    { id: "simulate", content: "Simulate Alternate Dates", panelID: "simulate-panel" },
    { id: "pegging", content: "Pegging Details", panelID: "pegging-panel" },
    { id: "learning", content: "Learning", panelID: "learning-panel" },
  ]

  const getStatusBadge = (status: string) => {
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

  return (
    <Page
      fullWidth
      title={`Order ${alert.orderNumber}`}
      subtitle={`${alert.shippingLocation} - ${alert.soldToCode}`}
      backAction={{ content: "Back to Order Performance", url: "/inv/order-performance" }}
      titleMetadata={
        <InlineStack gap="200">
          {getStatusBadge(alert.atpStatus)}
          <Badge tone={alert.priority === "High" ? "critical" : alert.priority === "Medium" ? "warning" : "info"}>
            {alert.priority} Priority
          </Badge>
          <Text as="span" variant="bodySm" tone="subdued">
            Plan Ship: {new Date(alert.planShipDate).toLocaleDateString()}
          </Text>
        </InlineStack>
      }
    >
      <Layout>
        {/* Alert Banner */}
        <Layout.Section>
          <Banner
            tone={alert.urgency === "Critical" ? "critical" : "warning"}
            title="Action Recommended"
          >
            <Text as="p" variant="bodyMd">
              {alert.recommendationText}
            </Text>
          </Banner>
        </Layout.Section>

        {/* Key Metrics Grid */}
        <Layout.Section>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Revenue at Risk
                  </Text>
                  <div style={{ width: '16px', height: '16px' }}>
                    <AlertCircleIcon />
                  </div>
                </InlineStack>
                <Text as="h3" variant="headingLg" fontWeight="bold" tone="critical">
                  ${alert.revenueAtRisk.toLocaleString()}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Total revenue considering current allocations
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Penalty Cost
                  </Text>
                  <div style={{ width: '16px', height: '16px' }}>
                    <ClockIcon />
                  </div>
                </InlineStack>
                <Text as="h3" variant="headingLg" fontWeight="bold" tone="warning">
                  ${alert.penaltyCost.toLocaleString()}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Total penalty cost considering existing delay in shipment
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Fill Rate
                  </Text>
                  <div style={{ width: '16px', height: '16px' }}>
                    <PackageIcon />
                  </div>
                </InlineStack>
                <Text as="h3" variant="headingLg" fontWeight="bold">
                  {alert.fillRate}%
                </Text>
                <ProgressBar progress={alert.fillRate} size="small" />
                <Text as="p" variant="bodySm" tone="subdued">
                  Order fulfillment rate considering the qty available
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Allocation Strategy
                  </Text>
                  <div style={{ width: '16px', height: '16px' }}>
                    <CalendarIcon />
                  </div>
                </InlineStack>
                <Text as="h3" variant="headingMd" fontWeight="bold">
                  {alert.allocationStrategy}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  Allocation strategy: {alert.allocationStrategy}
                </Text>
              </BlockStack>
            </Card>
          </div>
        </Layout.Section>

        {/* Main Content Tabs */}
        <Layout.Section>
          <Card>
            <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
              <Box padding="400">
                {/* ATP Details Tab */}
                {selectedTab === 0 && (
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <BlockStack gap="200">
                        <Text variant="headingMd" as="h3">
                          Order ATP Overview
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Line-level ATP status and allocation details
                        </Text>
                      </BlockStack>
                      <Button
                        variant="primary"
                        onClick={() => setIsConfirmModalActive(true)}
                      >
                        Accept Proposal
                      </Button>
                    </InlineStack>

                    <Card background="bg-surface-secondary">
                      <DataTable
                        columnContentTypes={[
                          'text',
                          'text',
                          'text',
                          'numeric',
                          'numeric',
                          'numeric',
                          'numeric',
                          'numeric',
                          'numeric',
                          'numeric',
                          'text',
                        ]}
                        headings={[
                          'Line #',
                          'Material',
                          'Description',
                          'Order Qty',
                          'ATP Qty',
                          'Fixed Qty',
                          'RISD Qty',
                          'Conf. Level',
                          'UoM',
                        ]}
                        rows={lineItems.map((item) => [
                          item.lineNumber,
                          item.materialCode,
                          item.description,
                          item.orderQty.toLocaleString(),
                          item.atpQty.toLocaleString(),
                          item.fixedQty.toLocaleString(),
                          item.risdQty.toLocaleString(),
                          `${item.confLevel}%`,
                          item.uom,
                        ])}
                      />
                    </Card>

                    <Layout>
                      <Layout.Section variant="oneHalf">
                        <Card>
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Order Summary for Customer {alert.soldToCode}
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              Total {lineItems.length} line items
                            </Text>
                            <BlockStack gap="200">
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Total Order Quantity:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {lineItems.reduce((sum, item) => sum + item.orderQty, 0).toLocaleString()} units
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Total Confirmed:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {lineItems.reduce((sum, item) => sum + item.atpQty, 0).toLocaleString()} units
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Unconfirmed:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium" tone="critical">
                                  {lineItems.reduce((sum, item) => sum + item.unconfirmedQty, 0).toLocaleString()} units
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section variant="oneHalf">
                        <Card>
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Date Information
                            </Text>
                            <BlockStack gap="200">
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Plan Ship Date:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {new Date(alert.planShipDate).toLocaleDateString()}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Current Ship Date:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {new Date(alert.currentShipDate).toLocaleDateString()}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Availability Date:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {new Date(alert.availDate).toLocaleDateString()}
                                </Text>
                              </InlineStack>
                            </BlockStack>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>
                  </BlockStack>
                )}

                {/* Simulate Alternate Dates Tab */}
                {selectedTab === 1 && (
                  <BlockStack gap="400">
                    <InlineStack align="space-between">
                      <BlockStack gap="200">
                        <Text variant="headingMd" as="h3">
                          Simulate Alternate Dates
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          Compare current vs. proposed shipment scenarios
                        </Text>
                      </BlockStack>
                      <InlineStack gap="200">
                        <Button onClick={() => setIsReportModalActive(true)}>
                          Generate Proposal
                        </Button>
                        <Button variant="primary">
                          Confirm Proposal
                        </Button>
                      </InlineStack>
                    </InlineStack>

                    <Layout>
                      <Layout.Section variant="oneHalf">
                        <Card>
                          <BlockStack gap="200">
                            <InlineStack align="space-between">
                              <TextField
                                label="Max Delay (Days)"
                                type="number"
                                value={maxDelay}
                                onChange={setMaxDelay}
                                autoComplete="off"
                              />
                              <TextField
                                label="Max Pallet Cut"
                                type="number"
                                value={maxPalletCut}
                                onChange={setMaxPalletCut}
                                autoComplete="off"
                              />
                            </InlineStack>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>

                    <Text variant="headingSm" as="h4">
                      Proposal Comparison
                    </Text>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "20px",
                      }}
                    >
                      {alternateProposals.map((proposal, index) => (
                        <Card
                          key={index}
                          background={proposal.isRecommended ? "bg-surface-success-subdued" : undefined}
                        >
                          <BlockStack gap="300">
                            <InlineStack align="space-between">
                              <Text variant="headingSm" as="h4">
                                {proposal.proposalName}
                              </Text>
                              {proposal.isRecommended && (
                                <Badge tone="success">Recommended</Badge>
                              )}
                            </InlineStack>

                            <BlockStack gap="200">
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Ship Date:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {new Date(proposal.shipDate).toLocaleDateString()}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Avail Date:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {new Date(proposal.availDate).toLocaleDateString()}
                                </Text>
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  ATP Status:
                                </Text>
                                {getStatusBadge(proposal.atpStatus)}
                              </InlineStack>
                              <InlineStack align="space-between">
                                <Text as="span" variant="bodySm" tone="subdued">
                                  Fill Rate:
                                </Text>
                                <Text as="span" variant="bodySm" fontWeight="medium">
                                  {proposal.fillRate}%
                                </Text>
                              </InlineStack>
                              {proposal.palletCut !== undefined && (
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm" tone="subdued">
                                    Pallets Cut:
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="medium">
                                    {proposal.palletCut}
                                  </Text>
                                </InlineStack>
                              )}
                            </BlockStack>

                            <Box
                              padding="300"
                              background="bg-surface-secondary"
                              borderRadius="200"
                            >
                              <BlockStack gap="100">
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm" fontWeight="medium">
                                    Penalty Cost:
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="bold" tone="warning">
                                    ${proposal.penaltyCost.toLocaleString()}
                                  </Text>
                                </InlineStack>
                                <InlineStack align="space-between">
                                  <Text as="span" variant="bodySm" fontWeight="medium">
                                    Revenue Loss:
                                  </Text>
                                  <Text as="span" variant="bodySm" fontWeight="bold" tone={proposal.revenueLoss > 0 ? "critical" : "success"}>
                                    ${proposal.revenueLoss.toLocaleString()}
                                  </Text>
                                </InlineStack>
                              </BlockStack>
                            </Box>
                          </BlockStack>
                        </Card>
                      ))}
                    </div>

                    <Card background="bg-surface-secondary">
                      <BlockStack gap="300">
                        <Text variant="headingSm" as="h4">
                          Supply Elements
                        </Text>
                        <DataTable
                          columnContentTypes={[
                            'numeric',
                            'text',
                            'text',
                            'numeric',
                            'numeric',
                            'text',
                            'text',
                            'text',
                          ]}
                          headings={[
                            'Line',
                            'Material',
                            'Description',
                            'Order Qty',
                            'Allocated Qty',
                            'Supply Number',
                            'Supply Date',
                            'Supply Type',
                          ]}
                          rows={
                            alternateProposals[0]?.supplyElements.map((elem) => [
                              elem.line,
                              elem.material,
                              elem.description,
                              elem.orderQty.toLocaleString(),
                              elem.allocatedQty.toLocaleString(),
                              elem.supplyNumber,
                              new Date(elem.supplyDate).toLocaleDateString(),
                              elem.supplyType,
                            ]) || []
                          }
                        />
                      </BlockStack>
                    </Card>
                  </BlockStack>
                )}

                {/* Pegging Details Tab */}
                {selectedTab === 2 && (
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingMd" as="h3">
                        Pegging Details
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Supply chain allocation and sourcing information
                      </Text>
                    </BlockStack>

                    <Card background="bg-surface-secondary">
                      <DataTable
                        columnContentTypes={[
                          'numeric',
                          'text',
                          'text',
                          'numeric',
                          'numeric',
                          'numeric',
                          'text',
                          'text',
                          'text',
                          'text',
                          'text',
                        ]}
                        headings={[
                          'Line #',
                          'Material',
                          'Description',
                          'Order Qty',
                          'ATP Qty',
                          'Seq #',
                          'Reqt Order #',
                          'Line #',
                          'Alt Material',
                          'Supply Type',
                          'Supply Date',
                        ]}
                        rows={peggingDetails.map((detail) => [
                          detail.lineNumber,
                          detail.materialCode,
                          detail.description,
                          detail.orderQty.toLocaleString(),
                          detail.atpQty.toLocaleString(),
                          detail.seqNumber,
                          detail.reqtOrderNumber,
                          detail.lineHash,
                          detail.alternativeMaterial,
                          detail.supplyType,
                          detail.supplyDate ? new Date(detail.supplyDate).toLocaleDateString() : 'N/A',
                        ])}
                      />
                    </Card>

                    <Banner tone="info" title="Supply Chain Insights">
                      <p>
                        This table shows how each line item is being sourced. The supply type indicates the source
                        (on-hand inventory, quality inspection, stock transfer orders, etc.).
                      </p>
                    </Banner>
                  </BlockStack>
                )}

                {/* Learning Tab */}
                {selectedTab === 3 && learningData && (
                  <BlockStack gap="400">
                    <BlockStack gap="200">
                      <Text variant="headingMd" as="h3">
                        Confidence Score Contributors
                      </Text>
                      <Text variant="bodySm" tone="subdued" as="p">
                        Factors influencing the recommendation confidence
                      </Text>
                    </BlockStack>

                    <Layout>
                      <Layout.Section variant="oneThird">
                        <Card>
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Value Achievement Probability
                            </Text>
                            <Text as="h1" variant="heading3xl" fontWeight="bold" tone="success">
                              {learningData.valueAchievement}%
                            </Text>
                            <Text variant="bodySm" tone="subdued" as="p">
                              If Accepted
                            </Text>
                          </BlockStack>
                        </Card>
                      </Layout.Section>

                      <Layout.Section>
                        <Card>
                          <BlockStack gap="300">
                            <Text variant="headingSm" as="h4">
                              Contributing Factors
                            </Text>
                            <div style={{ height: "300px" }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={learningData.contributors}
                                  layout="vertical"
                                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis type="number" domain={[-0.3, 0.3]} />
                                  <YAxis dataKey="name" type="category" />
                                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {learningData.contributors.map((entry, index) => (
                                      <Cell
                                        key={`cell-${index}`}
                                        fill={entry.impact === "positive" ? "#10b981" : "#ef4444"}
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </BlockStack>
                        </Card>
                      </Layout.Section>
                    </Layout>

                    <Card>
                      <BlockStack gap="300">
                        <Text variant="headingSm" as="h4">
                          Factor Details
                        </Text>
                        <DataTable
                          columnContentTypes={['text', 'numeric', 'text']}
                          headings={['Factor', 'Value', 'Impact']}
                          rows={learningData.contributors.map((contributor) => [
                            contributor.name,
                            contributor.value.toFixed(2),
                            <Badge
                              key={contributor.name}
                              tone={contributor.impact === "positive" ? "success" : "critical"}
                            >
                              {contributor.impact}
                            </Badge>,
                          ])}
                        />
                      </BlockStack>
                    </Card>

                    <Banner tone="info" title="Decision Summary">
                      <p>
                        The confidence score is calculated based on historical data, current inventory levels,
                        lead times, and customer prioritization. A score of {learningData.valueAchievement}%
                        indicates high confidence in the recommended action.
                      </p>
                    </Banner>
                  </BlockStack>
                )}
              </Box>
            </Tabs>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Confirmation Modal */}
      <Modal
        open={isConfirmModalActive}
        onClose={() => setIsConfirmModalActive(false)}
        title="Accept Proposal"
        primaryAction={{
          content: "Confirm",
          onAction: () => {
            console.log("Proposal accepted")
            setIsConfirmModalActive(false)
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsConfirmModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              Are you sure you want to accept this proposal?
            </Text>
            <Box
              padding="300"
              background="bg-surface-secondary"
              borderRadius="200"
            >
              <BlockStack gap="200">
                <Text as="p" variant="bodySm" fontWeight="medium">
                  This will:
                </Text>
                <Text as="p" variant="bodySm">
                  • Update the shipment date to {alert.proposedShipDate ? new Date(alert.proposedShipDate).toLocaleDateString() : 'proposed date'}
                </Text>
                <Text as="p" variant="bodySm">
                  • Improve fill rate to {alert.proposedFillRate || 100}%
                </Text>
                <Text as="p" variant="bodySm">
                  • Adjust penalty cost accordingly
                </Text>
              </BlockStack>
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>

      {/* Generate Proposal Modal */}
      <Modal
        open={isReportModalActive}
        onClose={() => setIsReportModalActive(false)}
        title="Generate New Proposal"
        primaryAction={{
          content: "Generate",
          onAction: () => {
            console.log("Generating proposal with max delay:", maxDelay, "and max pallet cut:", maxPalletCut)
            setIsReportModalActive(false)
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsReportModalActive(false),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              Generate a new proposal based on the parameters you've set.
            </Text>
            <Banner tone="info">
              <p>
                Max Delay: {maxDelay} days | Max Pallet Cut: {maxPalletCut}
              </p>
            </Banner>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  )
}
