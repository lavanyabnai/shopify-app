"use client"

import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { MoreHorizontal, AlertTriangle, Search, Filter, RotateCcw, TrendingUp } from "lucide-react"
import { Link } from "@remix-run/react"

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
      return <Badge variant="destructive">Critical Return Rate</Badge>
    case "High Return Rate":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          High Return Rate
        </Badge>
      )
    case "Moderate Return Rate":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Moderate Return Rate
        </Badge>
      )
    case "Low Return Rate":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800">
          Low Return Rate
        </Badge>
      )
    default:
      return <Badge variant="outline">{alertType}</Badge>
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "Critical":
      return <Badge variant="destructive">Critical</Badge>
    case "High":
      return <Badge variant="secondary">High</Badge>
    case "Medium":
      return <Badge variant="outline">Medium</Badge>
    case "Low":
      return <Badge variant="outline">Low</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

function getResolutionStatusBadge(status: string) {
  switch (status) {
    case "Under Investigation":
    case "Supplier Investigation":
      return <Badge variant="destructive">{status}</Badge>
    case "Quality Review":
    case "Design Review":
    case "Engineering Analysis":
    case "Supplier Audit":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {status}
        </Badge>
      )
    case "Firmware Update":
    case "Software Patch":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          {status}
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function MetaVRReturnsRMATable() {
  const criticalAlerts = returnsRMAData.filter((item) => item.priority === "Critical").length
  const totalCost = returnsRMAData.reduce((sum, item) => sum + item.estimatedCost, 0)
  const totalReturns = returnsRMAData.reduce((sum, item) => sum + item.returnQuantity, 0)
  const avgReturnRate = returnsRMAData.reduce((sum, item) => sum + item.returnRate, 0) / returnsRMAData.length

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">META VR Returns & RMA Management</h1>
          <p className="text-muted-foreground">Monitor product returns, defects, and RMA processing</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Cost Impact</div>
            <div className="text-xl font-bold">${(totalCost / 1000000).toFixed(1)}M</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Avg Return Rate</div>
            <div className="text-xl font-bold text-red-600">{avgReturnRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-orange-800">Active RMA Alerts</span>
            <Badge variant="secondary">{returnsRMAData.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-700">Critical Issues</span>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {criticalAlerts}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-700">Total Returns</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {totalReturns.toLocaleString()}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-700">Processing Time: 3-14 days</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by RMA, product, defect..." className="pl-10" />
        </div>
        <Button variant="breadcrumb" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">RMA Number</TableHead>
              <TableHead className="font-semibold">Product Model</TableHead>
              <TableHead className="font-semibold">Return Reason</TableHead>
              <TableHead className="font-semibold">Return Rate</TableHead>
              <TableHead className="font-semibold">Quantity</TableHead>
              <TableHead className="font-semibold">Cost Impact</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Resolution Status</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returnsRMAData.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/50 cursor-pointer">
                <Link
                  to={`/returns-rma/${encodeURIComponent(item.rmaNumber)}-${encodeURIComponent(item.sku)}-${index}`}
                  className="contents"
                >
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold">{item.rmaNumber}</div>
                      <div className="text-sm text-muted-foreground">{item.customerType}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.productModel}</div>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{item.sku}</code>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.returnReason}</div>
                      <div className="text-sm text-muted-foreground">{item.defectCategory}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-red-600">{item.returnRate}%</span>
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    </div>
                    <div className="text-xs text-muted-foreground">{getAlertBadge(item.alertType)}</div>
                  </TableCell>
                  <TableCell className="font-medium">{item.returnQuantity.toLocaleString()}</TableCell>
                  <TableCell className="font-medium">${(item.estimatedCost / 1000000).toFixed(2)}M</TableCell>
                  <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                  <TableCell>{getResolutionStatusBadge(item.resolutionStatus)}</TableCell>
                  <TableCell className="text-sm">{item.dueDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="breadcrumb" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View RMA Details</DropdownMenuItem>
                        <DropdownMenuItem>Process Return</DropdownMenuItem>
                        <DropdownMenuItem>Contact Customer</DropdownMenuItem>
                        <DropdownMenuItem>Escalate Issue</DropdownMenuItem>
                        <DropdownMenuItem>Generate Report</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </Link>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
