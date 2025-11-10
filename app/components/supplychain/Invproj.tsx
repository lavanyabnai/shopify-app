import { useState } from "react"
import type {
  ColumnContentType
} from "@shopify/polaris";
import {
  Page,
  Card,
  DataTable,
  Badge,
  Select,
  Text,
  Layout,
  LegacyStack,
  InlineStack,
  Banner
} from "@shopify/polaris"
import { InfoIcon } from "@shopify/polaris-icons"

interface InventoryData {
  parameter: string
  unit: string
  weeks: (number | string)[]
  colorCode?: boolean
}

interface SKUData {
  id: string
  name: string
  price: number
  category: string
}

interface FilterState {
  sku: string
  region: string
  scenario: string
}

// SKU definitions
const skuData: SKUData[] = [
  { id: "drill-20v", name: "CRAFTSMAN 20V MAX Cordless Drill", price: 129, category: "Tools" },
  { id: "mower-42", name: "Husqvarna 42-inch Riding Mower", price: 2499, category: "Lawn & Garden" },
  { id: "fridge-25cf", name: "Whirlpool 25 Cu Ft Stainless Steel Refrigerator", price: 1899, category: "Appliances" },
  { id: "flooring-oak", name: "Pergo Oak Laminate Flooring (per sq ft)", price: 3.99, category: "Flooring" },
  { id: "shed-10x12", name: "Suncast 10x12 Storage Shed", price: 1299, category: "Storage" },
]

const regions = [
  { label: "All Regions", value: "all-regions" },
  { label: "Northeast", value: "northeast" },
  { label: "Southeast", value: "southeast" },
  { label: "Midwest", value: "midwest" },
  { label: "West", value: "west" },
]

const scenarios = [
  { label: "Base Case", value: "base" },
  { label: "Spring Peak Season", value: "spring-peak" },
  { label: "Winter Low Season", value: "winter-low" },
]

// Generate realistic weekly data based on SKU and filters
const generateWeeklyData = (sku: string, region: string, scenario: string): InventoryData[] => {
  const selectedSKU = skuData.find((s) => s.id === sku) || skuData[0]

  // Base multipliers based on SKU category and price
  const baseMultiplier =
    selectedSKU.category === "Tools"
      ? 1.2
      : selectedSKU.category === "Lawn & Garden"
        ? 0.8
        : selectedSKU.category === "Appliances"
          ? 0.6
          : selectedSKU.category === "Flooring"
            ? 1.5
            : selectedSKU.category === "Storage"
              ? 0.4
              : 1.0

  // Region multipliers
  const regionMultiplier =
    region === "northeast"
      ? 1.1
      : region === "southeast"
        ? 1.3
        : region === "midwest"
          ? 0.9
          : region === "west"
            ? 1.0
            : 1.0

  // Scenario multipliers
  const scenarioMultiplier = scenario === "spring-peak" ? 1.4 : scenario === "winter-low" ? 0.6 : 1.0

  const totalMultiplier = baseMultiplier * regionMultiplier * scenarioMultiplier

  // Base forecast numbers
  const baseForecast = [15, 18, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45]
  const forecast = baseForecast.map((val) => Math.round(val * totalMultiplier))

  return [
    {
      parameter: "Forecast",
      unit: "units ('000)",
      weeks: forecast,
      colorCode: false,
    },
    {
      parameter: "Actual Sales (past weeks only)",
      unit: "units ('000)",
      weeks: [
        Math.round(forecast[0] * 0.97),
        Math.round(forecast[1] * 0.99),
        Math.round(forecast[2] * 0.98),
        Math.round(forecast[3] * 0.97),
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
      ],
      colorCode: false,
    },
    {
      parameter: "Forecast Accuracy (past weeks only)",
      unit: "%",
      weeks: [96.7, 98.9, 97.7, 96.8, "-", "-", "-", "-", "-", "-", "-", "-"],
      colorCode: false,
    },
    {
      parameter: "Despatch Plan",
      unit: "units ('000)",
      weeks: forecast,
      colorCode: false,
    },
    {
      parameter: "Receipt Plan as per Despatch & LT",
      unit: "units ('000)",
      weeks: forecast.map((val) => Math.round(val * 1.33)),
      colorCode: false,
    },
    {
      parameter: "Actual Despatch (past weeks only)",
      unit: "units ('000)",
      weeks: [
        Math.round(forecast[0] * 0.99),
        Math.round(forecast[1] * 0.995),
        Math.round(forecast[2] * 0.99),
        Math.round(forecast[3] * 0.992),
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
        "-",
      ],
      colorCode: false,
    },
    {
      parameter: "Projected Stock (units including backlog)",
      unit: "units ('000)",
      weeks: forecast.map((val, idx) => Math.round(val * (1.67 + idx * 0.1))),
      colorCode: true,
    },
    {
      parameter: "Projected Stock (units physically available)",
      unit: "units ('000)",
      weeks: forecast.map((val, idx) => Math.round(val * (1.47 + idx * 0.08))),
      colorCode: true,
    },
    {
      parameter: "Proj Stock 30-60 (units)",
      unit: "units ('000)",
      weeks: forecast.map((val) => Math.round(val * 0.33)),
      colorCode: false,
    },
    {
      parameter: "Proj Stock 60-90 (units)",
      unit: "units ('000)",
      weeks: forecast.map((val) => Math.round(val * 0.2)),
      colorCode: false,
    },
    {
      parameter: "Proj Stock >90 (units)",
      unit: "units ('000)",
      weeks: forecast.map((val) => Math.round(val * 0.13)),
      colorCode: false,
    },
    {
      parameter: "Projected Stock (USD)",
      unit: "$ M",
      weeks: forecast.map((val, idx) => Math.round(((val * (1.67 + idx * 0.1) * selectedSKU.price) / 1000) * 10) / 10),
      colorCode: false,
    },
    {
      parameter: "Days Supply",
      unit: "days",
      weeks: [40, 42, 45, 48, 50, 52, 55, 58, 60, 62, 65, 67].map((val) =>
        scenario === "optimistic" ? Math.round(val * 0.9) : scenario === "pessimistic" ? Math.round(val * 1.2) : val,
      ),
      colorCode: true,
    },
    {
      parameter: "Inventory Carrying Cost (USD)",
      unit: "$ M",
      weeks: forecast.map(
        (val, idx) => Math.round(((val * (1.67 + idx * 0.1) * selectedSKU.price) / 1000) * 0.05 * 100) / 100,
      ),
      colorCode: false,
    },
    {
      parameter: "Revenue",
      unit: "$ M",
      weeks: forecast.map((val) => Math.round(((val * selectedSKU.price) / 1000) * 10) / 10),
      colorCode: false,
    },
    {
      parameter: "Gross Margin",
      unit: "%",
      weeks: [28.5, 29.2, 30.1, 31.0, 31.5, 32.0, 32.5, 33.0, 33.2, 33.5, 33.8, 34.0].map((val) =>
        selectedSKU.category === "Premium" ? val + 2 : selectedSKU.category === "Enterprise" ? val + 5 : val - 3,
      ),
      colorCode: false,
    },
  ]
}

// Color coding functions for different parameters
const getStockColor = (value: number | string): "critical" | "warning" | "success" | "info" | undefined => {
  if (typeof value !== "number") return undefined
  if (value < 0) return "critical" // Stockout
  if (value < 20) return "warning" // Below minimum (20K units)
  if (value < 80) return "success" // In limits (80K units)
  return "info" // Overstock
}

const getDaysSupplyColor = (value: number | string): "critical" | "warning" | "success" | "info" | undefined => {
  if (typeof value !== "number") return undefined
  if (value < 30) return "critical" // Too low
  if (value < 45) return "warning" // Below optimal
  if (value < 60) return "success" // Optimal
  return "info" // Excess
}

const getCellBadgeTone = (parameter: string, value: number | string): "critical" | "warning" | "success" | "info" | undefined => {
  if (!value || value === "-") return undefined

  if (parameter.includes("Projected Stock") && parameter.includes("units")) {
    return getStockColor(value)
  }
  if (parameter === "Days Supply") {
    return getDaysSupplyColor(value)
  }
  return undefined
}

const formatValue = (value: number | string): string => {
  if (value === "-") return "-"
  if (typeof value === "string") return value
  return value.toString()
}

// Generate week headers
const getWeekHeaders = (): string[] => {
  const weeks = []
  const currentDate = new Date()

  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(currentDate)
    weekDate.setDate(currentDate.getDate() + i * 7)
    const month = weekDate.toLocaleDateString("en-US", { month: "short" })
    const weekNum = Math.ceil(weekDate.getDate() / 7)
    weeks.push(`${month}-W${weekNum}`)
  }

  return weeks
}

export default function MetaQuestInventory() {
  const [filters, setFilters] = useState<FilterState>({
    sku: "drill-20v",
    region: "all-regions",
    scenario: "base",
  })

  const inventoryData = generateWeeklyData(filters.sku, filters.region, filters.scenario)
  const weekHeaders = getWeekHeaders()
  const selectedSKU = skuData.find((s) => s.id === filters.sku) || skuData[0]

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  // Prepare data for DataTable
  const tableHeaders = ["Parameter", "Unit", ...weekHeaders]
  
  const tableRows = inventoryData.map((item) => [
    item.parameter,
    item.unit,
    ...item.weeks.map((week, weekIndex) => {
      const badgeTone = item.colorCode ? getCellBadgeTone(item.parameter, week) : undefined
      if (badgeTone) {
        return (
          // eslint-disable-next-line react/jsx-key
          <Badge tone={badgeTone}>
            {formatValue(week)}
          </Badge>
        )
      }
      return formatValue(week)
    })
  ])

  const columnContentTypes = [
    'text', // Parameter
    'text', // Unit
    ...weekHeaders.map(() => 'text' as const) // Week columns
  ]

  return (
    <Page
    fullWidth={true}
      title="Inventory Projections - Home Improvement Products"
      subtitle="Monitor inventory levels and projections across different scenarios"
    >
      <Layout>
        {/* Filter Controls */}
        <Layout.Section >
          <Card>
            <div >
              <Text variant="headingMd" as="h3">Filter Controls</Text>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <Select
                  label="Product Selection"
                  options={skuData.map((sku) => ({
                    label: `${sku.name} - $${sku.price}`,
                    value: sku.id,
                  }))}
                  value={filters.sku}
                  onChange={(value) => handleFilterChange("sku", value)}
                />

                <Select
                  label="Region"
                  options={regions}
                  value={filters.region}
                  onChange={(value) => handleFilterChange("region", value)}
                />

                <Select
                  label="Scenario"
                  options={scenarios}
                  value={filters.scenario}
                  onChange={(value) => handleFilterChange("scenario", value)}
                />
              </div>

              {/* Selected SKU Info */}
              <div style={{ marginTop: '16px' }}>
                <InlineStack gap="200">
                  <Badge>{selectedSKU.name}</Badge>
                  <Badge tone="info">{`Category: ${String(selectedSKU.category)}`}</Badge>
                  <Badge tone="success">{`Price: $${selectedSKU.price.toString()}`}</Badge>
                </InlineStack>
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Color Legend */}
        <Layout.Section>
          <Banner
            title="Color Coding Legend"
            icon={InfoIcon}
            tone="info"
          >
      
              <InlineStack gap="200">
                <Badge tone="critical">Red: Stockout/Critical</Badge>
                <Badge tone="warning">Yellow: Below Minimum</Badge>
                <Badge tone="success">Green: Optimal Range</Badge>
                <Badge tone="info">Blue: Overstock</Badge>
              </InlineStack>
       
          </Banner>
        </Layout.Section>

        {/* Data Table */}
        <Layout.Section>
          <Card>
            <DataTable
              columnContentTypes={columnContentTypes as ColumnContentType[]}
              headings={tableHeaders}
              rows={tableRows}
              hoverable
            />
          </Card>
        </Layout.Section>

        {/* Information Card */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '16px' }}>
              <Text variant="headingMd" as="h3">Filter Information & Color Coding</Text>
              
              {/* Two Column Layout */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '24px', 
                marginTop: '16px' 
              }}>
                {/* Column 1: Current Selection */}
                <div>
                  <Text variant="headingSm" as="h4">Current Selection:</Text>
                  <LegacyStack spacing="tight" vertical>
                    <Text variant="bodyMd" as="p">
                      <strong>SKU:</strong> {selectedSKU.name} ({selectedSKU.category} category)
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Region:</strong> {regions.find((r) => r.value === filters.region)?.label}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      <strong>Scenario:</strong> {scenarios.find((s) => s.value === filters.scenario)?.label}
                    </Text>
                  </LegacyStack>
                </div>

                {/* Column 2: Color Coding Legend */}
                <div>
                  <Text variant="headingSm" as="h4">Color Coding Legend:</Text>
                  
                  <div style={{ marginTop: '8px' }}>
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Projected Stock (Units):</Text>
                    <LegacyStack spacing="tight" vertical>
                      <InlineStack gap="200">
                        <Badge tone="critical">Red</Badge>
                        <Text variant="bodyMd" as="span">Stock &lt; 0 (Stockout)</Text>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Badge tone="warning">Yellow</Badge>
                        <Text variant="bodyMd" as="span">Stock &lt; 20K units</Text>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Badge tone="success">Green</Badge>
                        <Text variant="bodyMd" as="span">20K-80K units (Optimal)</Text>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Badge tone="info">Blue</Badge>
                        <Text variant="bodyMd" as="span">Stock &gt; 80K units</Text>
                      </InlineStack>
                    </LegacyStack>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <Text variant="bodyMd" as="p" fontWeight="semibold">Days Supply:</Text>
                    <LegacyStack spacing="tight" vertical>
                      <InlineStack gap="200">
                        <Badge tone="critical">Red</Badge>
                        <Text variant="bodyMd" as="span">&lt; 30 days (Critical)</Text>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Badge tone="warning">Yellow</Badge>
                        <Text variant="bodyMd" as="span">30-45 days (Below optimal)</Text>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Badge tone="success">Green</Badge>
                        <Text variant="bodyMd" as="span">45-60 days (Optimal)</Text>
                      </InlineStack>
                      <InlineStack gap="200">
                        <Badge tone="info">Blue</Badge>
                        <Text variant="bodyMd" as="span">&gt; 60 days (Excess)</Text>
                      </InlineStack>
                    </LegacyStack>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
