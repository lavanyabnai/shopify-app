/**
 * Order Performance / ATP Alert Service
 *
 * This service provides mock data for order fulfillment alerts
 * based on Available-to-Promise (ATP) analysis.
 */

export interface OrderPerformanceAlert {
  id: string
  orderNumber: string
  customerCode: string
  shippingLocation: string
  soldToCode: string
  atpStatus: "Unconfirmed" | "Partially confirmed" | "Fully confirmed" | "Limited confirmed"
  lcStatus: string
  revenueAtRisk: number
  penaltyCost: number
  fillRate: number
  planShipDate: string
  currentShipDate: string
  availDate: string
  proposedShipDate?: string
  proposedAvailDate?: string
  proposedFillRate?: number
  recommendationText: string
  priority: "High" | "Medium" | "Low"
  urgency: "Critical" | "High" | "Medium" | "Low"
  status: "Open" | "Waiting" | "Closed"
  allocationStrategy: string
}

export interface OrderLineItem {
  lineNumber: number
  materialCode: string
  description: string
  orderQty: number
  unconfirmedQty: number
  atpQty: number
  fixedQty: number
  risdQty: number
  palletShort: number
  confLevel: number
  uom: string
  fillRate: number
}

export interface PeggingDetail {
  lineNumber: number
  materialCode: string
  description: string
  orderQty: number
  atpQty: number
  seqNumber: number
  reqtOrderNumber: string
  lineHash: string
  alternativeMaterial: string
  supplyType: string
  supplyNumber?: string
  supplyDate?: string
}

export interface AlternateProposal {
  proposalName: string
  shipDate: string
  availDate: string
  atpStatus: string
  fillRate: number
  palletCut?: number
  penaltyCost: number
  revenueLoss: number
  supplyElements: Array<{
    line: number
    material: string
    description: string
    orderQty: number
    allocatedQty: number
    supplyNumber: string
    supplyDate: string
    supplyType: string
  }>
  isRecommended: boolean
}

export interface LearningData {
  contributors: Array<{
    name: string
    value: number
    impact: "positive" | "negative"
  }>
  valueAchievement: number
  decisionSummary?: string
  processFlow?: string
}

// Mock data based on the images provided
const mockAlerts: OrderPerformanceAlert[] = [
  {
    id: "1",
    orderNumber: "1000005046",
    customerCode: "C003",
    shippingLocation: "L002",
    soldToCode: "C003",
    atpStatus: "Unconfirmed",
    lcStatus: "RLSD",
    revenueAtRisk: 83169,
    penaltyCost: 9163,
    fillRate: 70,
    planShipDate: "2024-11-21",
    currentShipDate: "2024-11-21",
    availDate: "2024-11-19",
    proposedShipDate: "2024-12-17",
    proposedAvailDate: "2024-12-15",
    proposedFillRate: 100,
    recommendationText: "Delay the shipment by 2 Days for Order 1000005046 to get an improved fill rate and reduced penalty cost",
    priority: "High",
    urgency: "Critical",
    status: "Open",
    allocationStrategy: "Customer Prioritization",
  },
  {
    id: "2",
    orderNumber: "1000007040",
    customerCode: "C010",
    shippingLocation: "L004",
    soldToCode: "C010",
    atpStatus: "Unconfirmed",
    lcStatus: "FIXD",
    revenueAtRisk: 52400,
    penaltyCost: 5800,
    fillRate: 65,
    planShipDate: "2024-11-22",
    currentShipDate: "2024-11-22",
    availDate: "2024-11-20",
    proposedShipDate: "2024-11-23",
    proposedAvailDate: "2024-11-21",
    proposedFillRate: 95,
    recommendationText: "Delay the shipment by 1 Day for Order 1000007040 to get an improved fill rate",
    priority: "High",
    urgency: "High",
    status: "Open",
    allocationStrategy: "Customer Prioritization",
  },
  {
    id: "3",
    orderNumber: "1000002036",
    customerCode: "C002",
    shippingLocation: "L013",
    soldToCode: "C002",
    atpStatus: "Partially confirmed",
    lcStatus: "RLSD",
    revenueAtRisk: 41250,
    penaltyCost: 4580,
    fillRate: 93,
    planShipDate: "2024-11-20",
    currentShipDate: "2024-11-20",
    availDate: "2024-11-19",
    recommendationText: "Release the Order 1000002036 to the DC with a fill rate of 93%",
    priority: "Medium",
    urgency: "Medium",
    status: "Open",
    allocationStrategy: "Customer Prioritization",
  },
  {
    id: "4",
    orderNumber: "1000001011",
    customerCode: "C001",
    shippingLocation: "L013",
    soldToCode: "C001",
    atpStatus: "Partially confirmed",
    lcStatus: "RLSD",
    revenueAtRisk: 28900,
    penaltyCost: 3200,
    fillRate: 61,
    planShipDate: "2024-11-19",
    currentShipDate: "2024-11-19",
    availDate: "2024-11-18",
    recommendationText: "Release the Order 1000001011 to the DC with a fill rate of 61%",
    priority: "Medium",
    urgency: "Medium",
    status: "Open",
    allocationStrategy: "Customer Prioritization",
  },
  {
    id: "5",
    orderNumber: "1000000996",
    customerCode: "C002",
    shippingLocation: "L013",
    soldToCode: "C002",
    atpStatus: "Limited confirmed",
    lcStatus: "RLSD",
    revenueAtRisk: 53820,
    penaltyCost: 5980,
    fillRate: 70,
    planShipDate: "2024-11-21",
    currentShipDate: "2024-11-21",
    availDate: "2024-11-19",
    proposedShipDate: "2024-12-03",
    proposedAvailDate: "2024-12-01",
    proposedFillRate: 85,
    recommendationText: "Delay the shipment by 12 Days for Order 1000000996 to get an improved fill rate",
    priority: "High",
    urgency: "High",
    status: "Open",
    allocationStrategy: "Customer Prioritization",
  },
  {
    id: "6",
    orderNumber: "1000000950",
    customerCode: "C003",
    shippingLocation: "L017",
    soldToCode: "C003",
    atpStatus: "Limited confirmed",
    lcStatus: "FIXD",
    revenueAtRisk: 38700,
    penaltyCost: 4290,
    fillRate: 73,
    planShipDate: "2024-11-23",
    currentShipDate: "2024-11-23",
    availDate: "2024-11-21",
    recommendationText: "Release the Order 1000000950 to the DC with a fill rate of 73%",
    priority: "Medium",
    urgency: "Medium",
    status: "Waiting",
    allocationStrategy: "Customer Prioritization",
  },
  {
    id: "7",
    orderNumber: "1000000968",
    customerCode: "C003",
    shippingLocation: "L017",
    soldToCode: "C003",
    atpStatus: "Limited confirmed",
    lcStatus: "RLSD",
    revenueAtRisk: 22100,
    penaltyCost: 2450,
    fillRate: 51,
    planShipDate: "2024-11-24",
    currentShipDate: "2024-11-24",
    availDate: "2024-11-22",
    recommendationText: "Release the Order 1000000968 to the DC with a fill rate of 51%",
    priority: "Low",
    urgency: "Low",
    status: "Open",
    allocationStrategy: "Customer Prioritization",
  },
  {
    id: "8",
    orderNumber: "1000002863",
    customerCode: "C007",
    shippingLocation: "L006",
    soldToCode: "C007",
    atpStatus: "Partially confirmed",
    lcStatus: "RLSD",
    revenueAtRisk: 45600,
    penaltyCost: 5060,
    fillRate: 77,
    planShipDate: "2024-11-25",
    currentShipDate: "2024-11-25",
    availDate: "2024-11-23",
    recommendationText: "Release the Order 1000002863 to the DC with a fill rate of 77%",
    priority: "Medium",
    urgency: "Medium",
    status: "Open",
    allocationStrategy: "Customer Prioritization",
  },
]

// Mock line items for Order 1000005046
const mockLineItems: Record<string, OrderLineItem[]> = {
  "1": [
    {
      lineNumber: 10,
      materialCode: "1001",
      description: "HOME CARE 1001",
      orderQty: 1189,
      unconfirmedQty: 171,
      atpQty: 1018,
      fixedQty: 1018,
      risdQty: 1018,
      palletShort: 1.7,
      confLevel: 86,
      uom: "CS",
      fillRate: 86,
    },
    {
      lineNumber: 20,
      materialCode: "1002",
      description: "HOME CARE 1002",
      orderQty: 1101,
      unconfirmedQty: 0,
      atpQty: 1101,
      fixedQty: 1101,
      risdQty: 1101,
      palletShort: 0,
      confLevel: 100,
      uom: "CS",
      fillRate: 100,
    },
    {
      lineNumber: 30,
      materialCode: "1003",
      description: "HOME CARE 1003",
      orderQty: 282,
      unconfirmedQty: 0,
      atpQty: 282,
      fixedQty: 282,
      risdQty: 282,
      palletShort: 0,
      confLevel: 100,
      uom: "CS",
      fillRate: 100,
    },
    {
      lineNumber: 40,
      materialCode: "1004",
      description: "HOME CARE 1004",
      orderQty: 873,
      unconfirmedQty: 873,
      atpQty: 0,
      fixedQty: 0,
      risdQty: 0,
      palletShort: 8.8,
      confLevel: 0,
      uom: "CS",
      fillRate: 0,
    },
  ],
}

// Mock pegging details for Order 1000005046
const mockPeggingDetails: Record<string, PeggingDetail[]> = {
  "1": [
    {
      lineNumber: 10,
      materialCode: "1001",
      description: "HOME CARE 1001",
      orderQty: 1189,
      atpQty: 2036,
      seqNumber: 1,
      reqtOrderNumber: "1001",
      lineHash: "L013",
      alternativeMaterial: "1001",
      supplyType: "OH_INV",
      supplyNumber: "4567890956",
      supplyDate: "2024-12-14",
    },
    {
      lineNumber: 10,
      materialCode: "1001",
      description: "HOME CARE 1001",
      orderQty: 1189,
      atpQty: 2036,
      seqNumber: 2,
      reqtOrderNumber: "10000000508",
      lineHash: "999",
      alternativeMaterial: "1001",
      supplyType: "Q_INSP",
      supplyDate: "2024-12-14",
    },
    {
      lineNumber: 40,
      materialCode: "1004",
      description: "HOME CARE 1004",
      orderQty: 873,
      atpQty: 0,
      seqNumber: 1,
      reqtOrderNumber: "1004",
      lineHash: "L013",
      alternativeMaterial: "1004",
      supplyType: "Inbound STO - On Order Confirmed",
      supplyNumber: "4567890956",
      supplyDate: "2024-12-14",
    },
  ],
}

// Mock alternate proposals
const mockAlternateProposals: Record<string, AlternateProposal[]> = {
  "1": [
    {
      proposalName: "Current",
      shipDate: "2024-11-21",
      availDate: "2024-11-19",
      atpStatus: "Limited confirmed",
      fillRate: 70,
      palletCut: 11,
      penaltyCost: 9163,
      revenueLoss: 34820,
      supplyElements: [
        {
          line: 10,
          material: "1001",
          description: "HOME CARE 1001",
          orderQty: 1189,
          allocatedQty: 171,
          supplyNumber: "Inbound STO",
          supplyDate: "2024-12-14",
          supplyType: "On Order Confirmed",
        },
        {
          line: 40,
          material: "1004",
          description: "HOME CARE 1004",
          orderQty: 873,
          allocatedQty: 873,
          supplyNumber: "Inbound STO",
          supplyDate: "2024-12-14",
          supplyType: "On Order Confirmed",
        },
      ],
      isRecommended: false,
    },
    {
      proposalName: "Proposed",
      shipDate: "2024-12-17",
      availDate: "2024-12-15",
      atpStatus: "Fully confirmed",
      fillRate: 100,
      palletCut: 0,
      penaltyCost: 13090,
      revenueLoss: 0,
      supplyElements: [
        {
          line: 10,
          material: "1001",
          description: "HOME CARE 1001",
          orderQty: 1189,
          allocatedQty: 171,
          supplyNumber: "Inbound STO",
          supplyDate: "2024-12-14",
          supplyType: "On Order Confirmed",
        },
        {
          line: 40,
          material: "1004",
          description: "HOME CARE 1004",
          orderQty: 873,
          allocatedQty: 873,
          supplyNumber: "Inbound STO",
          supplyDate: "2024-12-14",
          supplyType: "On Order Confirmed",
        },
      ],
      isRecommended: true,
    },
  ],
}

// Mock learning data
const mockLearningData: Record<string, LearningData> = {
  "1": {
    contributors: [
      { name: "Balance", value: 0.09, impact: "positive" },
      { name: "Fill Rate", value: 0.12, impact: "positive" },
      { name: "Lead Time", value: -0.2, impact: "negative" },
      { name: "Shipment Cost", value: -0.2, impact: "negative" },
      { name: "Allocation Strategy", value: 0.14, impact: "positive" },
      { name: "Product Category", value: 0.16, impact: "positive" },
      { name: "Reject (N_Attain_80)", value: 0.2, impact: "positive" },
    ],
    valueAchievement: 80,
  },
}

/**
 * Get all order performance alerts
 */
export function getOrderPerformanceAlerts(): OrderPerformanceAlert[] {
  return mockAlerts
}

/**
 * Get a single order performance alert by ID
 */
export function getOrderPerformanceAlert(id: string): OrderPerformanceAlert | undefined {
  return mockAlerts.find((alert) => alert.id === id)
}

/**
 * Get line items for a specific alert
 */
export function getOrderLineItems(alertId: string): OrderLineItem[] {
  return mockLineItems[alertId] || []
}

/**
 * Get pegging details for a specific alert
 */
export function getPeggingDetails(alertId: string): PeggingDetail[] {
  return mockPeggingDetails[alertId] || []
}

/**
 * Get alternate proposals for a specific alert
 */
export function getAlternateProposals(alertId: string): AlternateProposal[] {
  return mockAlternateProposals[alertId] || []
}

/**
 * Get learning data for a specific alert
 */
export function getLearningData(alertId: string): LearningData | undefined {
  return mockLearningData[alertId]
}

/**
 * Get summary statistics
 */
export function getOrderPerformanceSummary() {
  const totalAlerts = mockAlerts.length
  const openAlerts = mockAlerts.filter((a) => a.status === "Open").length
  const totalRevenueAtRisk = mockAlerts.reduce((sum, a) => sum + a.revenueAtRisk, 0)
  const totalPenaltyCost = mockAlerts.reduce((sum, a) => sum + a.penaltyCost, 0)
  const avgFillRate = mockAlerts.reduce((sum, a) => sum + a.fillRate, 0) / totalAlerts
  const criticalAlerts = mockAlerts.filter((a) => a.urgency === "Critical").length

  return {
    totalAlerts,
    openAlerts,
    totalRevenueAtRisk,
    totalPenaltyCost,
    avgFillRate: Math.round(avgFillRate),
    criticalAlerts,
  }
}
