import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { MoreHorizontal, AlertTriangle, Search, TrendingUp, TrendingDown } from "lucide-react"

import { useParams } from "@remix-run/react"


const finishedGoodsData = [
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

function getAlertBadge(alertType: string, priority: string) {
  switch (priority) {
    case "critical":
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          {alertType}
        </Badge>
      )
    case "high":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
          {alertType}
        </Badge>
      )
    case "low":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          {alertType}
        </Badge>
      )
    case "normal":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          {alertType}
        </Badge>
      )
    default:
      return <Badge variant="outline">{alertType}</Badge>
  }
}

function getSalesVelocityIcon(velocity: string) {
  if (velocity.startsWith("+")) {
    return <TrendingUp className="h-4 w-4 text-green-600" />
  } else if (velocity.startsWith("-")) {
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }
  return null
}

export default function MetaVRFinishedGoodsTable() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const criticalAlerts = finishedGoodsData.filter((item) => item.priority === "critical").length
  const highAlerts = finishedGoodsData.filter((item) => item.priority === "high").length
  const totalUnits = finishedGoodsData.reduce((sum, item) => sum + item.currentStock, 0)

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
         
          <h1 className="mt-2 text-2xl font-bold">META VR Finished Goods Inventory</h1>
          <p className="text-muted-foreground">Monitor VR headset distribution and retail inventory levels</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{totalUnits.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Units in Stock</div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-800">Inventory Alerts</span>
            <Badge variant="destructive">{criticalAlerts + highAlerts}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700">Critical Shortage</span>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {criticalAlerts}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700">Stock Shortage</span>
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              {highAlerts}
            </Badge>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by SKU, model, or location..." className="pl-10" />
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Distribution Center</TableHead>
              <TableHead className="font-semibold">Product Model</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="font-semibold">Current Stock</TableHead>
              <TableHead className="font-semibold">Forecast vs Actual</TableHead>
              <TableHead className="font-semibold">Alert Status</TableHead>
              <TableHead className="font-semibold">Days of Inventory</TableHead>
              <TableHead className="font-semibold">Retail Partner</TableHead>
              <TableHead className="font-semibold">Sales Velocity</TableHead>
              <TableHead className="font-semibold">Next Shipment</TableHead>
              <TableHead className="font-semibold">Retail Price</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finishedGoodsData.map((item, index) => (
              <TableRow 
                key={index} 
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  window.location.href = `/workspaces/${workspaceId}/controlKpi/finished-goods/${encodeURIComponent(item.distributionCenter)}-${encodeURIComponent(item.sku)}`
                }}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{item.distributionCenter.split(" (")[0]}</div>
                    <div className="text-sm text-muted-foreground">{item.region}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.productModel}</div>
                </TableCell>
                <TableCell>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{item.sku}</code>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.currentStock.toLocaleString()} units</div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Forecast: </span>
                      <span className="font-medium">{item.forecastDemand.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.currentStock > item.forecastDemand ? "Surplus" : "Deficit"}:{" "}
                      {Math.abs(item.currentStock - item.forecastDemand).toLocaleString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getAlertBadge(item.alertType, item.priority)}</TableCell>
                <TableCell>
                  <div className="font-medium">{item.daysOfInventory} days</div>
                  <div className="text-xs text-muted-foreground">
                    {item.daysOfInventory < 20
                      ? "Low coverage"
                      : item.daysOfInventory > 50
                        ? "High coverage"
                        : "Good coverage"}
                  </div>
                </TableCell>
                <TableCell>{item.retailPartner}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSalesVelocityIcon(item.salesVelocity)}
                    <span
                      className={`font-medium ${item.salesVelocity.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                    >
                      {item.salesVelocity}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{item.nextShipment}</TableCell>
                <TableCell className="font-medium">{item.retailPrice}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="breadcrumb" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Inventory Details</DropdownMenuItem>
                      <DropdownMenuItem>Adjust Forecast</DropdownMenuItem>
                      <DropdownMenuItem>Schedule Shipment</DropdownMenuItem>
                      <DropdownMenuItem>Contact Retail Partner</DropdownMenuItem>
                      <DropdownMenuItem>Generate Sales Report</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
