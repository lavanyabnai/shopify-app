import React, { useState } from "react"

import {
  Page,
  Card,
  Badge,
  Button,
  TextField,
  Select,
  Tabs,
  ProgressBar,
  Text,
  Layout,
  LegacyStack,
  InlineStack,
  Icon,
  Popover,
  ActionList,
  IndexTable,
  useIndexResourceState,

} from "@shopify/polaris"


import {
  AlertTriangleIcon,
  SearchIcon,
  FilterIcon,
  PackageIcon,
  CalendarIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  MenuHorizontalIcon,
} from "@shopify/polaris-icons"
import { DollarSignIcon, Download as DownloadIcon, Zap as ZapIcon } from "lucide-react"

// Define interfaces for our data
interface VRInventoryAgingItem {
  id: string
  sku: string
  description: string
  category: string
  location: string
  quantity: number
  unitCost: number
  totalValue: number
  daysInInventory: number
  agingBucket: string
  turnoverRate: number
  lastMovementDate: string
  launchDate: string
  nextGenReleaseDate?: string
  recommendations: VRRecommendation[]
  kpis: VRKPI[]
  riskLevel: "low" | "medium" | "high" | "critical"
  techObsolescenceRisk: "low" | "medium" | "high"
}

interface VRRecommendation {
  id: string
  type: string
  action: string
  impact: string
  priority: "low" | "medium" | "high"
  potentialSavings?: number
  timeframe: string
}

interface VRKPI {
  name: string
  value: string | number
  trend: "up" | "down" | "neutral"
  target?: string | number
  unit?: string
}

// Sample Meta VR inventory aging data
const metaVRInventoryData: VRInventoryAgingItem[] = [
  {
    id: "VR-1001",
    sku: "META-QUEST2-128GB",
    description: "Meta Quest 2 VR Headset 128GB",
    category: "VR Headsets",
    location: "Warehouse North America",
    quantity: 245,
    unitCost: 199.99,
    totalValue: 48997.55,
    daysInInventory: 195,
    agingBucket: "180+ days",
    turnoverRate: 0.6,
    lastMovementDate: "2024-11-20",
    launchDate: "2020-10-13",
    nextGenReleaseDate: "2024-10-15",
    recommendations: [
      {
        id: "rec-vr1001-1",
        type: "Clearance Sale",
        action: "Apply 25% discount for Quest 2 clearance before Quest 3S launch",
        impact: "Move 70% of inventory within 45 days before new model cannibalization",
        priority: "high",
        potentialSavings: 12249.39,
        timeframe: "30-45 days",
      },
      {
        id: "rec-vr1001-2",
        type: "Bundle Strategy",
        action: "Create Quest 2 starter bundles with Elite Strap and carrying case",
        impact: "Increase perceived value while clearing aging Quest 2 inventory",
        priority: "high",
        potentialSavings: 9799.51,
        timeframe: "60 days",
      },
      {
        id: "rec-vr1001-3",
        type: "B2B Sales",
        action: "Target enterprise/education markets for bulk Quest 2 sales",
        impact: "Leverage lower price point for institutional buyers",
        priority: "medium",
        timeframe: "90 days",
      },
      {
        id: "rec-vr1001-4",
        type: "Trade-in Program",
        action: "Launch Quest 2 trade-in program for Quest 3 upgrades",
        impact: "Drive Quest 3 sales while clearing Quest 2 inventory",
        priority: "medium",
        potentialSavings: 7349.63,
        timeframe: "120 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$12,249", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 195, trend: "up", target: 45, unit: "days" },
      { name: "Turnover Rate", value: 0.6, trend: "down", target: 4.0 },
      { name: "Tech Obsolescence Risk", value: "High", trend: "up" },
      { name: "Margin Erosion", value: "-22%", trend: "down" },
    ],
    riskLevel: "critical",
    techObsolescenceRisk: "high",
  },
  {
    id: "VR-1002",
    sku: "META-QUEST2-256GB",
    description: "Meta Quest 2 VR Headset 256GB",
    category: "VR Headsets",
    location: "Warehouse Europe",
    quantity: 156,
    unitCost: 299.99,
    totalValue: 46798.44,
    daysInInventory: 187,
    agingBucket: "180+ days",
    turnoverRate: 0.7,
    lastMovementDate: "2024-12-01",
    launchDate: "2020-10-13",
    nextGenReleaseDate: "2024-10-15",
    recommendations: [
      {
        id: "rec-vr1002-1",
        type: "Premium Bundle",
        action: "Create premium Quest 2 bundles with Link Cable and Pro accessories",
        impact: "Position as premium entry-level option vs Quest 3",
        priority: "high",
        potentialSavings: 9359.69,
        timeframe: "45 days",
      },
      {
        id: "rec-vr1002-2",
        type: "Regional Discount",
        action: "Apply region-specific discounts in slower-moving markets",
        impact: "Optimize pricing by region to accelerate movement",
        priority: "medium",
        timeframe: "60 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$11,699", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 187, trend: "up", target: 45, unit: "days" },
      { name: "Turnover Rate", value: 0.7, trend: "down", target: 4.0 },
      { name: "Tech Obsolescence Risk", value: "High", trend: "up" },
      { name: "Margin Erosion", value: "-20%", trend: "down" },
    ],
    riskLevel: "critical",
    techObsolescenceRisk: "high",
  },
  {
    id: "VR-1003",
    sku: "META-QUEST3-128GB",
    description: "Meta Quest 3 VR Headset 128GB",
    category: "VR Headsets",
    location: "Warehouse North America",
    quantity: 89,
    unitCost: 399.99,
    totalValue: 35599.11,
    daysInInventory: 125,
    agingBucket: "121-180 days",
    turnoverRate: 1.4,
    lastMovementDate: "2025-01-15",
    launchDate: "2023-10-10",
    recommendations: [
      {
        id: "rec-vr1003-1",
        type: "Holiday Promotion",
        action: "Position Quest 3 as premium holiday gift with accessories bundle",
        impact: "Leverage holiday season to move current-gen inventory",
        priority: "medium",
        timeframe: "30 days",
      },
      {
        id: "rec-vr1003-2",
        type: "Gaming Bundle",
        action: "Create gaming bundles with popular VR titles and accessories",
        impact: "Increase value proposition for gaming enthusiasts",
        priority: "medium",
        timeframe: "45 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$4,450", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 125, trend: "up", target: 60, unit: "days" },
      { name: "Turnover Rate", value: 1.4, trend: "down", target: 3.0 },
      { name: "Tech Obsolescence Risk", value: "Medium", trend: "neutral" },
      { name: "Margin Impact", value: "-8%", trend: "down" },
    ],
    riskLevel: "medium",
    techObsolescenceRisk: "medium",
  },
  {
    id: "VR-1004",
    sku: "META-QUEST3-512GB",
    description: "Meta Quest 3 VR Headset 512GB",
    category: "VR Headsets",
    location: "Warehouse Asia Pacific",
    quantity: 67,
    unitCost: 499.99,
    totalValue: 33499.33,
    daysInInventory: 98,
    agingBucket: "91-120 days",
    turnoverRate: 1.8,
    lastMovementDate: "2025-02-10",
    launchDate: "2023-10-10",
    recommendations: [
      {
        id: "rec-vr1004-1",
        type: "Premium Positioning",
        action: "Market as premium VR solution for content creators and professionals",
        impact: "Target high-value customer segments",
        priority: "medium",
        timeframe: "60 days",
      },
      {
        id: "rec-vr1004-2",
        type: "Developer Program",
        action: "Offer discounts to VR developers and content creators",
        impact: "Build ecosystem while moving premium inventory",
        priority: "low",
        timeframe: "90 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$3,283", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 98, trend: "up", target: 60, unit: "days" },
      { name: "Turnover Rate", value: 1.8, trend: "neutral", target: 3.0 },
      { name: "Tech Obsolescence Risk", value: "Low", trend: "neutral" },
      { name: "Margin Impact", value: "-3%", trend: "neutral" },
    ],
    riskLevel: "medium",
    techObsolescenceRisk: "low",
  },
  {
    id: "VR-1005",
    sku: "META-QUESTPRO",
    description: "Meta Quest Pro VR Headset",
    category: "VR Headsets",
    location: "Warehouse North America",
    quantity: 34,
    unitCost: 999.99,
    totalValue: 33999.66,
    daysInInventory: 220,
    agingBucket: "180+ days",
    turnoverRate: 0.4,
    lastMovementDate: "2024-10-15",
    launchDate: "2022-10-25",
    recommendations: [
      {
        id: "rec-vr1005-1",
        type: "Enterprise Focus",
        action: "Pivot to enterprise and professional markets with B2B pricing",
        impact: "Target businesses needing high-end VR for training/collaboration",
        priority: "high",
        potentialSavings: 10199.9,
        timeframe: "90 days",
      },
      {
        id: "rec-vr1005-2",
        type: "Deep Discount",
        action: "Apply 40% discount to move Quest Pro inventory",
        impact: "Aggressive pricing to clear high-value aging inventory",
        priority: "high",
        potentialSavings: 13599.86,
        timeframe: "60 days",
      },
      {
        id: "rec-vr1005-3",
        type: "Developer Incentive",
        action: "Offer Quest Pro units to VR developers at cost",
        impact: "Build developer ecosystem while clearing inventory",
        priority: "medium",
        timeframe: "120 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$7,480", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 220, trend: "up", target: 90, unit: "days" },
      { name: "Turnover Rate", value: 0.4, trend: "down", target: 2.0 },
      { name: "Tech Obsolescence Risk", value: "High", trend: "up" },
      { name: "Margin Erosion", value: "-35%", trend: "down" },
    ],
    riskLevel: "critical",
    techObsolescenceRisk: "high",
  },
  {
    id: "VR-2001",
    sku: "META-ELITE-STRAP",
    description: "Meta Quest Elite Strap",
    category: "VR Accessories",
    location: "Warehouse North America",
    quantity: 312,
    unitCost: 49.99,
    totalValue: 15596.88,
    daysInInventory: 165,
    agingBucket: "121-180 days",
    turnoverRate: 1.2,
    lastMovementDate: "2024-12-20",
    launchDate: "2020-10-13",
    recommendations: [
      {
        id: "rec-vr2001-1",
        type: "Bundle Inclusion",
        action: "Include Elite Strap in Quest 2 and Quest 3 bundles at reduced margin",
        impact: "Move accessory inventory while enhancing headset value proposition",
        priority: "high",
        timeframe: "45 days",
      },
      {
        id: "rec-vr2001-2",
        type: "Comfort Upgrade Campaign",
        action: "Market as essential comfort upgrade for existing Quest users",
        impact: "Target installed base for accessory sales",
        priority: "medium",
        timeframe: "60 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$1,716", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 165, trend: "up", target: 90, unit: "days" },
      { name: "Turnover Rate", value: 1.2, trend: "down", target: 6.0 },
      { name: "Attach Rate", value: "15%", trend: "down", target: "35%" },
    ],
    riskLevel: "medium",
    techObsolescenceRisk: "low",
  },
  {
    id: "VR-2002",
    sku: "META-LINK-CABLE",
    description: "Meta Quest Link Cable",
    category: "VR Accessories",
    location: "Warehouse Europe",
    quantity: 189,
    unitCost: 79.99,
    totalValue: 15118.11,
    daysInInventory: 145,
    agingBucket: "121-180 days",
    turnoverRate: 1.6,
    lastMovementDate: "2025-01-05",
    launchDate: "2020-10-13",
    recommendations: [
      {
        id: "rec-vr2002-1",
        type: "PC Gaming Bundle",
        action: "Bundle Link Cable with Quest headsets for PC VR gaming",
        impact: "Target PC gamers wanting wired VR experience",
        priority: "medium",
        timeframe: "60 days",
      },
      {
        id: "rec-vr2002-2",
        type: "Professional Use Case",
        action: "Market to developers and professionals needing stable connection",
        impact: "Position as professional tool for development and enterprise use",
        priority: "low",
        timeframe: "90 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$1,663", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 145, trend: "up", target: 75, unit: "days" },
      { name: "Turnover Rate", value: 1.6, trend: "down", target: 4.0 },
      { name: "Attach Rate", value: "12%", trend: "down", target: "25%" },
    ],
    riskLevel: "medium",
    techObsolescenceRisk: "medium",
  },
  {
    id: "VR-2003",
    sku: "META-CARRYING-CASE",
    description: "Meta Quest Carrying Case",
    category: "VR Accessories",
    location: "Warehouse Asia Pacific",
    quantity: 267,
    unitCost: 39.99,
    totalValue: 10677.33,
    daysInInventory: 112,
    agingBucket: "91-120 days",
    turnoverRate: 2.1,
    lastMovementDate: "2025-02-28",
    launchDate: "2020-10-13",
    recommendations: [
      {
        id: "rec-vr2003-1",
        type: "Travel Bundle",
        action: "Create travel bundles with carrying case for mobile VR users",
        impact: "Target users who want portable VR solutions",
        priority: "medium",
        timeframe: "45 days",
      },
      {
        id: "rec-vr2003-2",
        type: "Gift Bundle",
        action: "Include in gift bundles as value-add accessory",
        impact: "Enhance gift appeal while moving accessory inventory",
        priority: "low",
        timeframe: "60 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$1,068", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 112, trend: "up", target: 60, unit: "days" },
      { name: "Turnover Rate", value: 2.1, trend: "neutral", target: 6.0 },
      { name: "Attach Rate", value: "18%", trend: "neutral", target: "30%" },
    ],
    riskLevel: "low",
    techObsolescenceRisk: "low",
  },
  {
    id: "VR-3001",
    sku: "META-TOUCH-CONTROLLERS",
    description: "Meta Quest Touch Controllers (Pair)",
    category: "VR Controllers",
    location: "Warehouse North America",
    quantity: 78,
    unitCost: 129.99,
    totalValue: 10139.22,
    daysInInventory: 89,
    agingBucket: "61-90 days",
    turnoverRate: 2.8,
    lastMovementDate: "2025-03-15",
    launchDate: "2023-10-10",
    recommendations: [
      {
        id: "rec-vr3001-1",
        type: "Replacement Market",
        action: "Target existing Quest users needing controller replacements",
        impact: "Serve replacement and upgrade market for installed base",
        priority: "medium",
        timeframe: "60 days",
      },
      {
        id: "rec-vr3001-2",
        type: "Multi-User Setup",
        action: "Market additional controllers for family/multi-user setups",
        impact: "Expand use cases for households with multiple VR users",
        priority: "low",
        timeframe: "90 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$901", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 89, trend: "up", target: 45, unit: "days" },
      { name: "Turnover Rate", value: 2.8, trend: "neutral", target: 4.0 },
      { name: "Replacement Rate", value: "8%", trend: "neutral", target: "12%" },
    ],
    riskLevel: "low",
    techObsolescenceRisk: "low",
  },
  {
    id: "VR-4001",
    sku: "META-VR-CONTENT-BUNDLE",
    description: "Meta VR Content Bundle (Digital)",
    category: "VR Software",
    location: "Digital Distribution",
    quantity: 1500,
    unitCost: 29.99,
    totalValue: 44985.0,
    daysInInventory: 75,
    agingBucket: "61-90 days",
    turnoverRate: 3.2,
    lastMovementDate: "2025-03-20",
    launchDate: "2023-06-15",
    recommendations: [
      {
        id: "rec-vr4001-1",
        type: "Hardware Bundle",
        action: "Include content bundle with hardware purchases at reduced cost",
        impact: "Increase hardware value proposition while moving digital inventory",
        priority: "high",
        timeframe: "30 days",
      },
      {
        id: "rec-vr4001-2",
        type: "Seasonal Promotion",
        action: "Offer content bundle discounts during low hardware sales periods",
        impact: "Maintain engagement during hardware inventory transitions",
        priority: "medium",
        timeframe: "45 days",
      },
    ],
    kpis: [
      { name: "Holding Cost", value: "$3,374", trend: "up", unit: "USD" },
      { name: "Days of Supply", value: 75, trend: "up", target: 30, unit: "days" },
      { name: "Turnover Rate", value: 3.2, trend: "neutral", target: 8.0 },
      { name: "Attach Rate", value: "22%", trend: "down", target: "45%" },
    ],
    riskLevel: "low",
    techObsolescenceRisk: "low",
  },
]

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Helper function to get risk level badge
const getRiskBadge = (riskLevel: string) => {
  switch (riskLevel) {
    case "low":
      return <Badge tone="success">Low Risk</Badge>
    case "medium":
      return <Badge tone="warning">Medium Risk</Badge>
    case "high":
      return <Badge tone="critical">High Risk</Badge>
    case "critical":
      return <Badge tone="critical">Critical Risk</Badge>
    default:
      return <Badge>{riskLevel}</Badge>
  }
}

// Helper function to get tech obsolescence badge
const getTechObsolescenceBadge = (risk: string) => {
  switch (risk) {
    case "low":
      return <Badge tone="info">Low Tech Risk</Badge>
    case "medium":
      return <Badge tone="warning">Medium Tech Risk</Badge>
    case "high":
      return <Badge tone="critical">High Tech Risk</Badge>
    default:
      return <Badge>{risk}</Badge>
  }
}

// Helper function to get trend icon
const getTrendIcon = (trend: string) => {
  switch (trend) {
    case "up":
      return <Icon source={ChevronUpIcon} tone="critical" />
    case "down":
      return <Icon source={ChevronDownIcon} tone="success" />
    case "neutral":
      return <Icon source={ChevronRightIcon} tone="subdued" />
    default:
      return null
  }
}

// Helper function to get recommendation priority badge
const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "low":
      return <Badge tone="info">Low Priority</Badge>
    case "medium":
      return <Badge tone="warning">Medium Priority</Badge>
    case "high":
      return <Badge tone="critical">High Priority</Badge>
    default:
      return <Badge>{priority}</Badge>
  }
}

// Helper function to get aging bucket color
const getAgingBucketColor = (bucket: string): "success" | "warning" | "critical" => {
  switch (bucket) {
    case "0-30 days":
    case "31-60 days":
      return "success"
    case "61-90 days":
    case "91-120 days":
      return "warning"
    case "121-180 days":
    case "180+ days":
      return "critical"
    default:
      return "warning"
  }
}

export default function MetaVRAgingDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedAgingBucket, setSelectedAgingBucket] = useState("all")
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState(0)
  const [activePopover, setActivePopover] = useState<string | null>(null)
  const [sortConfig] = useState<{ key: string; direction: "ascending" | "descending" }>({
    key: "daysInInventory",
    direction: "descending",
  })

  // Toggle expanded state for an item
  const toggleItemExpanded = (id: string) => {
    setExpandedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }



  // Filter and sort data
  const filteredAndSortedData = [...metaVRInventoryData]
    .filter((item) => {
      const matchesSearch =
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory

      const matchesAgingBucket = selectedAgingBucket === "all" || item.agingBucket === selectedAgingBucket

      return matchesSearch && matchesCategory && matchesAgingBucket
    })
    .sort((a, b) => {
      const key = sortConfig.key as keyof VRInventoryAgingItem
      const aValue = a[key]
      const bValue = b[key]

      // Handle undefined values safely
      if (aValue === undefined && bValue === undefined) return 0
      if (aValue === undefined) return sortConfig.direction === "ascending" ? 1 : -1
      if (bValue === undefined) return sortConfig.direction === "ascending" ? -1 : 1

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1
      }
      return 0
    })

  // Calculate summary metrics
  const totalItems = filteredAndSortedData.length
  const totalValue = filteredAndSortedData.reduce((sum, item) => sum + item.totalValue, 0)
  const averageDaysInInventory = Math.round(
    filteredAndSortedData.reduce((sum, item) => sum + item.daysInInventory, 0) / (filteredAndSortedData.length || 1),
  )
  const criticalItems = filteredAndSortedData.filter((item) => item.riskLevel === "critical").length
  const highTechRiskItems = filteredAndSortedData.filter((item) => item.techObsolescenceRisk === "high").length

  // Get unique categories for filter
  const categories = Array.from(new Set(metaVRInventoryData.map((item) => item.category)))

  // Prepare data for IndexTable
  const resourceName = {
    singular: 'VR inventory item',
    plural: 'VR inventory items',
  }

  // Workaround: convert VRInventoryAgingItem[] to { [key: string]: unknown }[] for useIndexResourceState
  // by spreading each item into a plain object (shallow copy)
  const resourceStateData = filteredAndSortedData.map(item => ({ ...item }));

  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(resourceStateData);

  const rowMarkup = filteredAndSortedData.map(
    (item, index) => (
      <IndexTable.Row
        id={item.id}
        key={item.id}
        selected={selectedResources.includes(item.id)}
        position={index}
      >
        <IndexTable.Cell>
          <Button
            variant="tertiary"
            icon={expandedItems.includes(item.id) ? ChevronDownIcon : ChevronRightIcon}
            onClick={() => toggleItemExpanded(item.id)}
            size="slim"
          />
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {item.sku}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.description}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span">
            {item.category}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span" alignment="end">
            {item.quantity.toLocaleString()}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text variant="bodyMd" as="span" alignment="end">
            {formatCurrency(item.totalValue)}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <InlineStack gap="200" align="end">
            <Text variant="bodyMd" as="span" fontWeight="bold">
              {item.daysInInventory}
            </Text>
            {item.daysInInventory > 120 && <Icon source={AlertTriangleIcon} tone="critical" />}
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={getAgingBucketColor(item.agingBucket)}>
            {item.agingBucket}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {getRiskBadge(item.riskLevel)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {getTechObsolescenceBadge(item.techObsolescenceRisk)}
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Popover
            activator={
              <Button 
                icon={MenuHorizontalIcon} 
                variant="tertiary" 
                size="slim"
                onClick={() => setActivePopover(activePopover === item.id ? null : item.id)}
              />
            } 
            active={activePopover === item.id} 
            onClose={() => setActivePopover(null)}
          >
            <ActionList
              actionRole="menuitem"
              items={[
                {
                  content: 'View Product Details',
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
                {
                  content: 'View Sales History',
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
                {
                  content: 'Create VR Bundle',
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
                {
                  content: 'Apply Discount',
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
                {
                  content: 'Transfer to High-Traffic Store',
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
                {
                  content: 'Target Enterprise Sales',
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
                {
                  content: 'Launch Trade-in Program',
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
                {
                  content: 'Mark for Liquidation',
                  destructive: true,
                  onAction: () => {
                    setActivePopover(null)
                    // Add your action logic here
                  }
                },
              ]}
            />
          </Popover>
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  )

  return (
    <Page
      title="Meta VR Inventory Aging Dashboard"
      subtitle="VR headsets and accessories with aging alerts and tech obsolescence tracking"
      primaryAction={{
        content: 'Export',
        icon: () => <DownloadIcon size={20} />,
      }}
      secondaryActions={[
        {
          content: 'More Filters',
          icon: FilterIcon,
        },
      ]}
    >
      <Layout>
        {/* Search and Filters */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <LegacyStack spacing="loose">
                <div style={{ minWidth: '200px' }}>
                  <TextField
                    label=""
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search VR SKUs..."
                    autoComplete="off"
                    prefix={<Icon source={SearchIcon} />}
                    clearButton
                    onClearButtonClick={() => setSearchTerm('')}
                  />
                </div>
                
                <div style={{ minWidth: '150px' }}>
                  <Select
                    label="Category"
                    options={[
                      { label: 'All Categories', value: 'all' },
                      ...categories.map((category) => ({
                        label: category,
                        value: category,
                      })),
                    ]}
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                  />
                </div>

                <div style={{ minWidth: '150px' }}>
                  <Select
                    label="Aging Period"
                    options={[
                      { label: 'All Periods', value: 'all' },
                      { label: '0-30 days', value: '0-30 days' },
                      { label: '31-60 days', value: '31-60 days' },
                      { label: '61-90 days', value: '61-90 days' },
                      { label: '91-120 days', value: '91-120 days' },
                      { label: '121-180 days', value: '121-180 days' },
                      { label: '180+ days', value: '180+ days' },
                    ]}
                    value={selectedAgingBucket}
                    onChange={setSelectedAgingBucket}
                  />
                </div>
              </LegacyStack>
            </div>
          </Card>
        </Layout.Section>

        {/* Summary Cards */}
        <Layout.Section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <Card>
              <div style={{ padding: '16px' }}>
                <LegacyStack spacing="tight">
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">Total VR SKUs</Text>
                    <Text variant="headingLg" as="p">{totalItems}</Text>
                  </div>
                  <Icon source={PackageIcon} tone="info" />
                </LegacyStack>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '16px' }}>
                <LegacyStack spacing="tight">
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">Total Value</Text>
                    <Text variant="headingLg" as="p">{formatCurrency(totalValue)}</Text>
                  </div>
                  <Icon source={DollarSignIcon} tone="success" />
                </LegacyStack>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '16px' }}>
                <LegacyStack spacing="tight">
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">Avg. Days in Inventory</Text>
                    <Text variant="headingLg" as="p">{averageDaysInInventory}</Text>
                  </div>
                  <Icon source={CalendarIcon} tone="info" />
                </LegacyStack>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '16px' }}>
                <LegacyStack spacing="tight">
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">Critical Items</Text>
                    <Text variant="headingLg" as="p">{criticalItems}</Text>
                  </div>
                  <Icon source={AlertCircleIcon} tone="critical" />
                </LegacyStack>
              </div>
            </Card>

            <Card>
              <div style={{ padding: '16px' }}>
                <LegacyStack spacing="tight">
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">High Tech Risk</Text>
                    <Text variant="headingLg" as="p">{highTechRiskItems}</Text>
                  </div>
                  <ZapIcon size={20} />
                </LegacyStack>
              </div>
            </Card>
          </div>
        </Layout.Section>

        {/* Main Table */}
        <Layout.Section>
          <Card>
            <IndexTable
              resourceName={resourceName}
              itemCount={filteredAndSortedData.length}
              selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
              }
              onSelectionChange={handleSelectionChange}
              headings={[
                { title: '' },
                { title: 'SKU' },
                { title: 'Description' },
                { title: 'Category' },
                { title: 'Quantity', alignment: 'end' },
                { title: 'Total Value', alignment: 'end' },
                { title: 'Days in Inventory', alignment: 'end' },
                { title: 'Aging Bucket' },
                { title: 'Risk Level' },
                { title: 'Tech Risk' },
                { title: 'Actions' },
              ]}
            >
              {rowMarkup}
            </IndexTable>
          </Card>
        </Layout.Section>

        {/* Expanded Content for each item */}
        {expandedItems.map((itemId) => {
          const item = filteredAndSortedData.find((i) => i.id === itemId)
          if (!item) return null

          return (
            <Layout.Section key={itemId}>
              <Card>
                <div style={{ padding: '16px' }}>
                  <Tabs
                    selected={selectedTab}
                    onSelect={(selectedTabIndex) => setSelectedTab(selectedTabIndex)}
                    tabs={[
                      {
                        id: 'kpis',
                        content: 'VR KPIs',
                        accessibilityLabel: 'VR KPIs',
                        panelID: 'kpis-panel',
                      },
                      {
                        id: 'recommendations',
                        content: 'Recommendations',
                        accessibilityLabel: 'Recommendations',
                        panelID: 'recommendations-panel',
                      },
                      {
                        id: 'details',
                        content: 'Product Details',
                        accessibilityLabel: 'Product Details',
                        panelID: 'details-panel',
                      },
                    ]}
                  >
                    {selectedTab === 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        {item.kpis.map((kpi, index) => (
                          <Card key={index}>
                            <div style={{ padding: '16px' }}>
                              <LegacyStack spacing="tight" vertical>
                                <LegacyStack spacing="tight">
                                  <Text variant="bodySm" tone="subdued" as="span">{kpi.name}</Text>
                                  {getTrendIcon(kpi.trend)}
                                </LegacyStack>
                                <Text variant="headingMd" as="p">{kpi.value}</Text>
                                {kpi.target && (
                                  <div>
                                    <Text variant="bodySm" tone="subdued" as="p">
                                      Target: {kpi.target} {kpi.unit || ""}
                                    </Text>
                                    <ProgressBar
                                      progress={
                                        typeof kpi.value === "number"
                                          ? (kpi.value / (kpi.target as number)) * 100
                                          : 0
                                      }
                                      size="small"
                                    />
                                  </div>
                                )}
                              </LegacyStack>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {selectedTab === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {item.recommendations.map((rec) => (
                          <Card key={rec.id}>
                            <div style={{ padding: '16px' }}>
                              <LegacyStack spacing="loose" vertical>
                                <LegacyStack spacing="tight">
                                  <Badge tone="info">{rec.type}</Badge>
                                  {getPriorityBadge(rec.priority)}
                                  <Badge tone="critical">{rec.timeframe}</Badge>
                                </LegacyStack>
                                <Text variant="headingSm" as="h4">{rec.action}</Text>
                                <Text variant="bodyMd" tone="subdued" as="p">{rec.impact}</Text>
                                <LegacyStack spacing="tight">
                                  {rec.potentialSavings && (
                                    <div>
                                      <Text variant="bodySm" tone="subdued" as="p">Potential Savings</Text>
                                      <Text variant="headingSm" as="p" tone="success">
                                        {formatCurrency(rec.potentialSavings)}
                                      </Text>
                                    </div>
                                  )}
                                  <Button size="slim">Implement</Button>
                                </LegacyStack>
                              </LegacyStack>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}

                    {selectedTab === 2 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                        <Card>
                          <div style={{ padding: '16px' }}>
                            <Text variant="headingSm" as="h4">Product Information</Text>
                            <LegacyStack spacing="tight" vertical>
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Location:</Text>
                                <Text variant="bodyMd" as="span">{item.location}</Text>
                              </LegacyStack>
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Unit Cost:</Text>
                                <Text variant="bodyMd" as="span">{formatCurrency(item.unitCost)}</Text>
                              </LegacyStack>
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Total Value:</Text>
                                <Text variant="bodyMd" as="span">{formatCurrency(item.totalValue)}</Text>
                              </LegacyStack>
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Turnover Rate:</Text>
                                <Text variant="bodyMd" as="span">{item.turnoverRate.toFixed(1)}</Text>
                              </LegacyStack>
                            </LegacyStack>
                          </div>
                        </Card>

                        <Card>
                          <div style={{ padding: '16px' }}>
                            <Text variant="headingSm" as="h4">Product Lifecycle</Text>
                            <LegacyStack spacing="tight" vertical>
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Launch Date:</Text>
                                <Text variant="bodyMd" as="span">{item.launchDate}</Text>
                              </LegacyStack>
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Days in Inventory:</Text>
                                <Text variant="bodyMd" as="span">{item.daysInInventory}</Text>
                              </LegacyStack>
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Last Movement:</Text>
                                <Text variant="bodyMd" as="span">{item.lastMovementDate}</Text>
                              </LegacyStack>
                              {item.nextGenReleaseDate && (
                                <LegacyStack spacing="loose">
                                  <Text variant="bodySm" tone="subdued" as="span">Next Gen Release:</Text>
                                  <Text variant="bodyMd" as="span">{item.nextGenReleaseDate}</Text>
                                </LegacyStack>
                              )}
                              <LegacyStack spacing="loose">
                                <Text variant="bodySm" tone="subdued" as="span">Tech Risk:</Text>
                                <Text variant="bodyMd" as="span">
                                  {item.techObsolescenceRisk.charAt(0).toUpperCase() +
                                    item.techObsolescenceRisk.slice(1)}
                                </Text>
                              </LegacyStack>
                            </LegacyStack>
                          </div>
                        </Card>

                        <Card>
                          <div style={{ padding: '16px' }}>
                            <Text variant="headingSm" as="h4">VR Actions</Text>
                            <LegacyStack spacing="tight" vertical>
                              <Button size="slim" fullWidth>View VR Analytics</Button>
                              <Button size="slim" variant="tertiary" fullWidth>View Competitor Pricing</Button>
                              <Button size="slim" fullWidth>Check VR Market Trends</Button>
                              <Button size="slim" fullWidth>Generate VR Report</Button>
                            </LegacyStack>
                          </div>
                        </Card>
                      </div>
                    )}
                  </Tabs>
                </div>
              </Card>
            </Layout.Section>
          )
        })}

        {/* VR-Specific Legend */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingSm" as="h4">VR Inventory Management Guide</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '16px' }}>
                <div>
                  <Text variant="headingSm" as="h5">Aging Bucket Colors:</Text>
                  <LegacyStack spacing="tight" vertical>
                    <LegacyStack spacing="tight">
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#d1fae5', border: '1px solid #10b981', borderRadius: '4px' }}></div>
                      <Text variant="bodySm" as="span">0-30 days (Optimal)</Text>
                    </LegacyStack>
                    <LegacyStack spacing="tight">
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px' }}></div>
                      <Text variant="bodySm" as="span">31-60 days (Good)</Text>
                    </LegacyStack>
                    <LegacyStack spacing="tight">
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px' }}></div>
                      <Text variant="bodySm" as="span">61-90 days (Monitor)</Text>
                    </LegacyStack>
                    <LegacyStack spacing="tight">
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#fed7aa', border: '1px solid #ea580c', borderRadius: '4px' }}></div>
                      <Text variant="bodySm" as="span">91-120 days (Action Needed)</Text>
                    </LegacyStack>
                    <LegacyStack spacing="tight">
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#fed7aa', border: '1px solid #ea580c', borderRadius: '4px' }}></div>
                      <Text variant="bodySm" as="span">121-180 days (High Risk)</Text>
                    </LegacyStack>
                    <LegacyStack spacing="tight">
                      <div style={{ width: '16px', height: '16px', backgroundColor: '#fecaca', border: '1px solid #dc2626', borderRadius: '4px' }}></div>
                      <Text variant="bodySm" as="span">180+ days (Critical)</Text>
                    </LegacyStack>
                  </LegacyStack>
                </div>
                <div>
                  <Text variant="headingSm" as="h5">VR-Specific Considerations:</Text>
                  <LegacyStack spacing="tight" vertical>
                    <Text variant="bodySm" tone="subdued" as="p">• VR technology evolves rapidly - monitor tech obsolescence risk</Text>
                    <Text variant="bodySm" tone="subdued" as="p">• New generation releases significantly impact older model demand</Text>
                    <Text variant="bodySm" tone="subdued" as="p">• Consider bundling strategies to increase value proposition</Text>
                    <Text variant="bodySm" tone="subdued" as="p">• Enterprise and education markets may accept older models</Text>
                    <Text variant="bodySm" tone="subdued" as="p">• Seasonal demand patterns affect VR product movement</Text>
                    <Text variant="bodySm" tone="subdued" as="p">• Accessory attach rates are crucial for profitability</Text>
                  </LegacyStack>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
