import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Label } from "~/components/ui/label"

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
  { id: "all-regions", name: "All Regions" },
  { id: "northeast", name: "Northeast" },
  { id: "southeast", name: "Southeast" },
  { id: "midwest", name: "Midwest" },
  { id: "west", name: "West" },
]

const scenarios = [
  { id: "base", name: "Base Case" },
  { id: "spring-peak", name: "Spring Peak Season" },
  { id: "winter-low", name: "Winter Low Season" },
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
const getStockColor = (value: number | string): string => {
  if (typeof value !== "number") return ""
  if (value < 0) return "bg-red-500 text-white" // Stockout
  if (value < 20) return "bg-yellow-400 text-black" // Below minimum (20K units)
  if (value < 80) return "bg-green-500 text-white" // In limits (80K units)
  return "bg-blue-500 text-white" // Overstock
}

const getDaysSupplyColor = (value: number | string): string => {
  if (typeof value !== "number") return ""
  if (value < 30) return "bg-red-500 text-white" // Too low
  if (value < 45) return "bg-yellow-400 text-black" // Below optimal
  if (value < 60) return "bg-green-500 text-white" // Optimal
  return "bg-blue-500 text-white" // Excess
}

const getCellColor = (parameter: string, value: number | string): string => {
  if (!value || value === "-") return ""

  if (parameter.includes("Projected Stock") && parameter.includes("units")) {
    return getStockColor(value)
  }
  if (parameter === "Days Supply") {
    return getDaysSupplyColor(value)
  }
  return ""
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

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="mt-2 text-2xl font-bold">Inventory Projections - Home Improvement Products</CardTitle>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="sku-select">Product Selection</Label>
              <Select value={filters.sku} onValueChange={(value) => handleFilterChange("sku", value)}>
                <SelectTrigger id="sku-select">
                  <SelectValue placeholder="Select SKU" />
                </SelectTrigger>
                <SelectContent>
                  {skuData.map((sku) => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.name} - ${sku.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region-select">Region</Label>
              <Select value={filters.region} onValueChange={(value) => handleFilterChange("region", value)}>
                <SelectTrigger id="region-select">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scenario-select">Scenario</Label>
              <Select value={filters.scenario} onValueChange={(value) => handleFilterChange("scenario", value)}>
                <SelectTrigger id="scenario-select">
                  <SelectValue placeholder="Select Scenario" />
                </SelectTrigger>
                <SelectContent>
                  {scenarios.map((scenario) => (
                    <SelectItem key={scenario.id} value={scenario.id}>
                      {scenario.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected SKU Info */}
          <div className="flex gap-4 mt-4">
            <Badge variant="outline" className="text-sm">
              {selectedSKU.name}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Category: {selectedSKU.category}
            </Badge>
            <Badge variant="outline" className="text-sm">
              Price: ${selectedSKU.price}
            </Badge>
          </div>

          {/* Color Legend */}
          <div className="flex gap-2 flex-wrap mt-4">
            <Badge variant="outline" className="bg-red-500 text-white">
              Red: Stockout/Critical
            </Badge>
            <Badge variant="outline" className="bg-yellow-400 text-black">
              Yellow: Below Minimum
            </Badge>
            <Badge variant="outline" className="bg-green-500 text-white">
              Green: Optimal Range
            </Badge>
            <Badge variant="outline" className="bg-blue-500 text-white">
              Blue: Overstock
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold min-w-[250px]">Parameter</TableHead>
                  <TableHead className="font-semibold">Unit</TableHead>
                  {weekHeaders.map((week, index) => (
                    <TableHead key={index} className="font-semibold text-center min-w-[80px]">
                      {week}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.parameter}</TableCell>
                    <TableCell className="text-sm text-gray-600">{item.unit}</TableCell>
                    {item.weeks.map((week, weekIndex) => (
                      <TableCell
                        key={weekIndex}
                        className={`text-center font-medium ${
                          item.colorCode ? getCellColor(item.parameter, week) : ""
                        }`}
                      >
                        {formatValue(week)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Information & Color Coding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Current Selection:</h4>
            <ul className="text-sm space-y-1 ml-4">
              <li>
                <strong>SKU:</strong> {selectedSKU.name} ({selectedSKU.category} category)
              </li>
              <li>
                <strong>Region:</strong> {regions.find((r) => r.id === filters.region)?.name}
              </li>
              <li>
                <strong>Scenario:</strong> {scenarios.find((s) => s.id === filters.scenario)?.name}
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Projected Stock (Units) Color Coding:</h4>
            <ul className="text-sm space-y-1 ml-4">
              <li>
                <span className="inline-block w-4 h-4 bg-red-500 mr-2"></span>Red: Stock &lt; 0 (Stockout situation)
              </li>
              <li>
                <span className="inline-block w-4 h-4 bg-yellow-400 mr-2"></span>Yellow: Stock &lt; 20K units (Below
                minimum threshold)
              </li>
              <li>
                <span className="inline-block w-4 h-4 bg-green-500 mr-2"></span>Green: 20K-80K units (Optimal inventory
                levels)
              </li>
              <li>
                <span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span>Blue: Stock &gt; 80K units (Overstock
                situation)
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Days Supply Color Coding:</h4>
            <ul className="text-sm space-y-1 ml-4">
              <li>
                <span className="inline-block w-4 h-4 bg-red-500 mr-2"></span>Red: &lt; 30 days (Critical low supply)
              </li>
              <li>
                <span className="inline-block w-4 h-4 bg-yellow-400 mr-2"></span>Yellow: 30-45 days (Below optimal)
              </li>
              <li>
                <span className="inline-block w-4 h-4 bg-green-500 mr-2"></span>Green: 45-60 days (Optimal supply)
              </li>
              <li>
                <span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span>Blue: &gt; 60 days (Excess inventory)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
