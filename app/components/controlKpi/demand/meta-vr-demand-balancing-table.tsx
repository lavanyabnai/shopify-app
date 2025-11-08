import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../ui/dropdown-menu"
import { MoreHorizontal, AlertTriangle, Search, Filter, ArrowLeft } from "lucide-react"
import { Link } from "@remix-run/react"


const demandBalancingData = [
  {
    sourceLocation: "META-CA-01",
    materialCode: "VR-Q3-128",
    revenueImpact: 4291328,
    unitImpact: 199597,
    impactCoverage: 100.0,
    confidenceLevel: 81.21,
    predictedAction: "Transfer",
    actionPriority: "High",
    dueDate: "01/18/2025",
    description: "Transfer 5,500 units of Quest 3 128GB to META-TX-01 DC to fill projected backorders",
    alertType: "Stock Shortage",
    transferLeadTime: "3-5 days",
    currentStock: 12450,
    projectedDemand: 18000,
  },
  {
    sourceLocation: "META-EU-01",
    materialCode: "VR-Q3-512",
    revenueImpact: 3306994,
    unitImpact: 459010,
    impactCoverage: 100.0,
    confidenceLevel: 88.6,
    predictedAction: "Expedite",
    actionPriority: "High",
    dueDate: "01/20/2025",
    description: "Expedite existing stock transfer of 459,010 units of Quest 3 512GB to META-APAC-01 DC",
    alertType: "Critical Shortage",
    transferLeadTime: "7-10 days",
    currentStock: 8920,
    projectedDemand: 15200,
  },
  {
    sourceLocation: "META-TX-01",
    materialCode: "VR-PRO-256",
    revenueImpact: 2999437,
    unitImpact: 139185,
    impactCoverage: 100.0,
    confidenceLevel: 85.06,
    predictedAction: "Transfer",
    actionPriority: "High",
    dueDate: "01/19/2025",
    description: "Transfer 139,185 units of Quest Pro to META-NJ-01 DC to fill projected backorders",
    alertType: "Stock Shortage",
    transferLeadTime: "2-4 days",
    currentStock: 2340,
    projectedDemand: 8500,
  },
  {
    sourceLocation: "META-CA-01",
    materialCode: "VR-PRO-256",
    revenueImpact: 2029513,
    unitImpact: 96277,
    impactCoverage: 100.0,
    confidenceLevel: 85.06,
    predictedAction: "Transfer",
    actionPriority: "Medium",
    dueDate: "01/22/2025",
    description: "Transfer 96,277 units of Quest Pro to META-UK-01 DC to fill projected backorders",
    alertType: "Low Stock",
    transferLeadTime: "5-7 days",
    currentStock: 1890,
    projectedDemand: 4200,
  },
  {
    sourceLocation: "META-APAC-01",
    materialCode: "VR-Q3-128",
    revenueImpact: 1937593,
    unitImpact: 193480,
    impactCoverage: 100.0,
    confidenceLevel: 82.27,
    predictedAction: "Expedite",
    actionPriority: "High",
    dueDate: "01/21/2025",
    description: "Expedite existing stock transfer of 193,480 units of Quest 3 128GB to META-CA-01 DC",
    alertType: "Stock Shortage",
    transferLeadTime: "8-12 days",
    currentStock: 4560,
    projectedDemand: 9200,
  },
  {
    sourceLocation: "META-EU-01",
    materialCode: "VR-Q3-BUNDLE",
    revenueImpact: 1850740,
    unitImpact: 191730,
    impactCoverage: 100.0,
    confidenceLevel: 80.07,
    predictedAction: "Transfer",
    actionPriority: "Medium",
    dueDate: "01/25/2025",
    description: "Transfer 191,730 units of Quest 3 Elite Bundle to META-CA-01 DC to fill projected backorders",
    alertType: "Optimal Stock",
    transferLeadTime: "6-8 days",
    currentStock: 3420,
    projectedDemand: 4500,
  },
  {
    sourceLocation: "META-APAC-01",
    materialCode: "VR-Q3-512",
    revenueImpact: 1727740,
    unitImpact: 225300,
    impactCoverage: 100.0,
    confidenceLevel: 86.55,
    predictedAction: "Manufacture",
    actionPriority: "High",
    dueDate: "01/23/2025",
    description: "Manufacture additional 225,300 units of Quest 3 512GB to fill projected backorders",
    alertType: "Critical Shortage",
    transferLeadTime: "14-21 days",
    currentStock: 890,
    projectedDemand: 12000,
  },
  {
    sourceLocation: "META-TX-01",
    materialCode: "VR-Q3-128",
    revenueImpact: 1450534,
    unitImpact: 134558,
    impactCoverage: 100.0,
    confidenceLevel: 87.09,
    predictedAction: "Transfer",
    actionPriority: "Medium",
    dueDate: "01/24/2025",
    description: "Transfer 134,558 units of Quest 3 128GB to META-EU-01 DC to fill projected backorders",
    alertType: "Low Stock",
    transferLeadTime: "4-6 days",
    currentStock: 7240,
    projectedDemand: 6800,
  },
]

// function getAlertBadge(alertType: string) {
//   switch (alertType) {
//     case "Critical Shortage":
//       return <Badge variant="destructive">Critical Shortage</Badge>
//     case "Stock Shortage":
//       return (
//         <Badge variant="secondary" className="bg-orange-100 text-orange-800">
//           Stock Shortage
//         </Badge>
//       )
//     case "Low Stock":
//       return (
//         <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
//           Low Stock
//         </Badge>
//       )
//     case "Optimal Stock":
//       return (
//         <Badge variant="outline" className="bg-green-100 text-green-800">
//           Optimal Stock
//         </Badge>
//       )
//     default:
//       return <Badge variant="outline">{alertType}</Badge>
//   }
// }

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "High":
      return <Badge variant="destructive">High</Badge>
    case "Medium":
      return <Badge variant="secondary">Medium</Badge>
    case "Low":
      return <Badge variant="outline">Low</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

function getActionBadge(action: string) {
  switch (action) {
    case "Transfer":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800">
          Transfer
        </Badge>
      )
    case "Expedite":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Expedite
        </Badge>
      )
    case "Manufacture":
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          Manufacture
        </Badge>
      )
    default:
      return <Badge variant="outline">{action}</Badge>
  }
}

export default function MetaVRDemandBalancingTable() {
  const openAlerts = demandBalancingData.filter((item) => item.actionPriority === "High").length
  const totalRevenue = demandBalancingData.reduce((sum, item) => sum + item.revenueImpact, 0)

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
          <h1 className="mt-2 text-2xl font-bold">META VR Supply & Demand Balancing</h1>
          <p className="text-muted-foreground">Monitor and manage inventory transfers and demand forecasting</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Total Revenue Impact</div>
            <div className="text-xl font-bold">${(totalRevenue / 1000000).toFixed(1)}M</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">High Priority</div>
            <div className="text-xl font-bold text-red-600">{openAlerts}</div>
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-orange-600" />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-orange-800">Demand Balancing Alerts</span>
            <Badge variant="secondary">{demandBalancingData.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-700">High Priority Actions</span>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              {openAlerts}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-orange-700">Avg Confidence</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              {(
                demandBalancingData.reduce((sum, item) => sum + item.confidenceLevel, 0) / demandBalancingData.length
              ).toFixed(1)}
              %
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by location, material code..." className="pl-10" />
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
              <TableHead className="font-semibold">Source Location</TableHead>
              <TableHead className="font-semibold">Material Code</TableHead>
              <TableHead className="font-semibold">Revenue Impact</TableHead>
              <TableHead className="font-semibold">Unit Impact</TableHead>
              <TableHead className="font-semibold">Impact Coverage</TableHead>
              <TableHead className="font-semibold">Confidence Level</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Predicted Action</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandBalancingData.map((item, index) => (
              <TableRow key={index} className="hover:bg-muted/50 cursor-pointer">
                <Link
                  to={`/inv/demand-balancing/${encodeURIComponent(item.sourceLocation)}-${encodeURIComponent(item.materialCode)}-${index}`}
                  className="contents"
                >
                  <TableCell className="font-medium">{item.sourceLocation}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{item.materialCode}</code>
                  </TableCell>
                  <TableCell className="font-medium">${(item.revenueImpact / 1000000).toFixed(2)}M</TableCell>
                  <TableCell>{item.unitImpact.toLocaleString()}</TableCell>
                  <TableCell>{item.impactCoverage.toFixed(1)}%</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.confidenceLevel.toFixed(1)}%</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.confidenceLevel}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(item.actionPriority)}</TableCell>
                  <TableCell>{getActionBadge(item.predictedAction)}</TableCell>
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
                        <DropdownMenuItem>Execute Action</DropdownMenuItem>
                        <DropdownMenuItem>Modify Forecast</DropdownMenuItem>
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
