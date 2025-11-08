import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { MoreHorizontal, AlertTriangle, Search, Filter, ArrowLeft } from "lucide-react"
import { Link, useParams } from "@remix-run/react"

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
      return <Badge variant="destructive">Critical OOS</Badge>
    case "Severe OOS":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Severe OOS
        </Badge>
      )
    case "Moderate OOS":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          Moderate OOS
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
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

function getSupplierStatusBadge(status: string) {
  switch (status) {
    case "Production Halt":
    case "Equipment Failure":
      return <Badge variant="destructive">{status}</Badge>
    case "Capacity Issues":
    case "Quality Issues":
    case "Supply Chain Disruption":
    case "Workforce Shortage":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {status}
        </Badge>
      )
    case "Partial Production":
    case "Raw Material Delay":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
          {status}
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function MetaVRSupplierAlertsTable() {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const criticalAlerts = supplierAlertsData.filter((item) => item.priority === "Critical").length
  const totalImpact = supplierAlertsData.reduce((sum, item) => sum + item.estimatedImpact, 0)
  const avgShortage =
    supplierAlertsData.reduce((sum, item) => sum + item.shortagePercentage, 0) / supplierAlertsData.length

  return (
    <div className="w-full space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/inv/supplyChain`}>
            <Button variant="breadcrumb" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Supply Chain Control Tower
            </Button>
          </Link>
          <h1 className="mt-2 text-2xl font-bold">META VR Supplier OOS Alerts</h1>
          <p className="text-muted-foreground">Monitor critical supplier shortages and out-of-stock situations</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Impact</div>
            <div className="text-xl font-bold">${(totalImpact / 1000000).toFixed(1)}M</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Avg Shortage</div>
            <div className="text-xl font-bold text-red-600">{avgShortage.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-red-800">Supplier OOS Alerts</span>
            <Badge variant="destructive">{supplierAlertsData.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700">Critical Alerts</span>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {criticalAlerts}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-red-700">Affected Components</span>
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              {supplierAlertsData.reduce((sum, item) => sum + item.affectedSKUs, 0)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by supplier, component..." className="pl-10" />
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
              <TableHead className="font-semibold">Supplier</TableHead>
              <TableHead className="font-semibold">Component Type</TableHead>
              <TableHead className="font-semibold">Alert Type</TableHead>
              <TableHead className="font-semibold">Shortage %</TableHead>
              <TableHead className="font-semibold">Estimated Impact</TableHead>
              <TableHead className="font-semibold">Supplier Status</TableHead>
              <TableHead className="font-semibold">Recovery Time</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplierAlertsData.map((item, index) => (
              <TableRow 
                key={index} 
                className="hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  window.location.href = `/workspaces/${workspaceId}/controlKpi/supplier-alerts/${encodeURIComponent(item.supplierCode)}-${encodeURIComponent(item.materialCode)}-${index}`
                }}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="font-semibold">{item.supplierName}</div>
                    <div className="text-sm text-muted-foreground">{item.location}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.componentType}</div>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{item.materialCode}</code>
                  </div>
                </TableCell>
                <TableCell>{getAlertBadge(item.alertType)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-red-600">{item.shortagePercentage.toFixed(1)}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-600 h-2 rounded-full"
                        style={{ width: `${Math.min(item.shortagePercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">${(item.estimatedImpact / 1000000).toFixed(2)}M</TableCell>
                <TableCell>{getSupplierStatusBadge(item.supplierStatus)}</TableCell>
                <TableCell className="font-medium">{item.estimatedRecovery}</TableCell>
                <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                <TableCell className="text-sm">{item.dueDate}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="breadcrumb" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Contact Supplier</DropdownMenuItem>
                      <DropdownMenuItem>Escalate Alert</DropdownMenuItem>
                      <DropdownMenuItem>Find Alternatives</DropdownMenuItem>
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
