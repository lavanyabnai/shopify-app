import { useState } from "react"
import {
  Clock,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  CheckCircle,
  ArrowLeft,
  Factory,
  Star,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Link } from "@remix-run/react"

interface SupplierData {
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

interface SupplierOOSDashboardProps {
  supplierData: SupplierData
}

export default function SupplierOOSDashboard({ supplierData }: SupplierOOSDashboardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
 
  const isCritical = supplierData.priority === "Critical"

  // Mock data for charts and analysis
  const supplierPerformanceData = [
    { month: "Sep", onTime: 94, quality: 4.8, capacity: 95 },
    { month: "Oct", onTime: 92, quality: 4.7, capacity: 88 },
    { month: "Nov", onTime: 89, quality: 4.6, capacity: 75 },
    { month: "Dec", onTime: 87, quality: 4.5, capacity: 62 },
    { month: "Jan", onTime: 85, quality: 4.4, capacity: 45 },
  ]

  const componentBreakdown = [
    { name: "Quest 3 128GB", shortage: 98, impact: 1200000 },
    { name: "Quest 3 512GB", shortage: 95, impact: 980000 },
    { name: "Quest Pro", shortage: 94, impact: 670000 },
  ]

  const alternativeSuppliers = [
    {
      name: "Pegatron Corporation",
      location: "Taiwan",
      capacity: "75% of required",
      leadTime: "14-21 days",
      qualityRating: 4.6,
      cost: "+15% premium",
      availability: "Available",
    },
    {
      name: "Wistron Corporation",
      location: "Taiwan",
      capacity: "60% of required",
      leadTime: "21-28 days",
      qualityRating: 4.4,
      cost: "+8% premium",
      availability: "Partial",
    },
    {
      name: "Compal Electronics",
      location: "Taiwan",
      capacity: "45% of required",
      leadTime: "28-35 days",
      qualityRating: 4.3,
      cost: "+12% premium",
      availability: "Limited",
    },
  ]

  const resolutionOptions = [
    {
      id: 1,
      title: "Emergency Supplier Activation",
      recommended: false,
      details: ["• Activate backup supplier (Pegatron)", "• Expedite tooling and setup", "• Recovery time: 14-21 days"],
      cost: "$850,000",
      recoverySpeed: "Moderate",
      riskLevel: "Medium",
    },
    {
      id: 2,
      title: "Multi-Supplier Strategy",
      recommended: true,
      details: [
        "• Split production across 2-3 suppliers",
        "• Parallel qualification process",
        "• Recovery time: 10-14 days",
      ],
      cost: "$1,200,000",
      recoverySpeed: "Fast",
      riskLevel: "Low",
    },
    {
      id: 3,
      title: "Design Modification",
      recommended: false,
      details: [
        "• Modify component specifications",
        "• Use alternative materials/processes",
        "• Recovery time: 21-35 days",
      ],
      cost: "$2,100,000",
      recoverySpeed: "Slow",
      riskLevel: "High",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link to={`/inv/supplier-alerts`}>
              <Button variant="breadcrumb" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Supplier Alerts
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-blue-900">Supplier OOS Alert: {supplierData.componentType}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isCritical ? "destructive" : "secondary"}>{supplierData.priority} Priority</Badge>
            <Badge variant="outline">{supplierData.alertType}</Badge>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-10 w-64" placeholder="Search..." />
            </div>
            <Button variant="breadcrumb" className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>Jan 16, 2025</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {/* Alert Header */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-900 font-semibold">CRITICAL SUPPLIER ALERT:</span>
                      <span className="text-red-800">
                        {supplierData.supplierName} - {supplierData.componentType} Production Severely Impacted
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Current Stock Level</div>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-3xl font-bold text-red-600">
                        {((supplierData.currentStock / supplierData.requiredStock) * 100).toFixed(0)}%
                      </span>
                      <Badge variant="destructive" className="text-xs">
                        -{supplierData.shortagePercentage.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Severely below required</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Estimated Recovery</div>
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-3xl font-bold text-orange-600">{supplierData.estimatedRecovery}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Without intervention</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Affected SKUs</div>
                    <div className="flex items-center justify-center space-x-1">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-3xl font-bold text-blue-600">{supplierData.affectedSKUs}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">VR headset models</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alert Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-orange-700">Alert Details & Impact Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-700">
                    {supplierData.supplierName} has experienced a {supplierData.supplierStatus.toLowerCase()} affecting{" "}
                    {supplierData.componentType} production. Current stock levels are at{" "}
                    {supplierData.currentStock.toLocaleString()} units, representing a{" "}
                    {supplierData.shortagePercentage.toFixed(1)}% shortage from required levels of{" "}
                    {supplierData.requiredStock.toLocaleString()} units.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Financial Impact</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Revenue Loss:</span>
                          <span className="font-medium">${(supplierData.estimatedImpact / 1000000).toFixed(2)}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Contract Value:</span>
                          <span className="font-medium">${(supplierData.contractValue / 1000000).toFixed(0)}M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Units Short:</span>
                          <span className="font-medium">
                            {(supplierData.requiredStock - supplierData.currentStock).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Supplier Performance</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quality Rating:</span>
                          <span className="font-medium">{supplierData.qualityRating}/5.0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">On-Time Delivery:</span>
                          <span className="font-medium">{supplierData.onTimeDelivery}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Current Status:</span>
                          <span className="font-medium text-red-600">{supplierData.supplierStatus}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Component Shortage Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span>Component Shortage Breakdown</span>
                  </CardTitle>
                  <Badge variant="destructive" className="w-fit text-xs">
                    {supplierData.shortagePercentage.toFixed(1)}% overall shortage
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {componentBreakdown.map((component, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{component.name}</span>
                          <span className="text-gray-600">{component.shortage}% shortage</span>
                        </div>
                        <div className="flex space-x-2">
                          <div className="flex-1 bg-red-100 rounded">
                            <div
                              className="bg-red-500 h-6 rounded flex items-center justify-center text-white text-xs"
                              style={{ width: `${component.shortage}%` }}
                            >
                              Shortage: {component.shortage}%
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">Impact: ${(component.impact / 1000000).toFixed(1)}M</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                    <span>Supplier Performance Trend</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={supplierPerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "#6b7280" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="onTime"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", r: 4 }}
                          name="On-Time Delivery %"
                        />
                        <Line
                          type="monotone"
                          dataKey="capacity"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: "#ef4444", r: 4 }}
                          name="Capacity Utilization %"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-blue-600 font-medium">On-Time Delivery</div>
                      <div className="text-2xl font-bold text-red-600">85%</div>
                      <div className="text-gray-500">-9% decline</div>
                    </div>
                    <div className="text-center">
                      <div className="text-red-600 font-medium">Capacity Utilization</div>
                      <div className="text-2xl font-bold text-red-600">45%</div>
                      <div className="text-gray-500">-50% decline</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alternative Suppliers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Factory className="h-4 w-4 text-blue-500" />
                  <span>Alternative Supplier Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alternativeSuppliers.map((supplier, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">{supplier.name}</h4>
                        <Badge variant={supplier.availability === "Available" ? "outline" : "secondary"}>
                          {supplier.availability}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Location</div>
                          <div className="font-medium">{supplier.location}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Capacity</div>
                          <div className="font-medium">{supplier.capacity}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Lead Time</div>
                          <div className="font-medium">{supplier.leadTime}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Quality Rating</div>
                          <div className="font-medium flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {supplier.qualityRating}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Cost Impact: </span>
                        <span className="font-medium">{supplier.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resolution Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Resolution Options</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {resolutionOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`p-4 border rounded-lg ${option.recommended ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-medium text-sm">{option.title}</h3>
                          {option.recommended && <Badge className="mt-1 text-xs">Recommended</Badge>}
                        </div>

                        <div className="space-y-1">
                          {option.details.map((detail, index) => (
                            <div key={index} className="text-xs text-gray-700">
                              {detail}
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Cost:</span>
                            <span className="font-medium">{option.cost}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Recovery Speed:</span>
                            <Badge
                              variant={
                                option.recoverySpeed === "Fast"
                                  ? "default"
                                  : option.recoverySpeed === "Moderate"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs"
                            >
                              {option.recoverySpeed}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Risk Level:</span>
                            <Badge
                              variant={
                                option.riskLevel === "Low"
                                  ? "outline"
                                  : option.riskLevel === "Medium"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {option.riskLevel}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className={`w-full text-xs ${option.recommended ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                          variant={option.recommended ? "primary" : "breadcrumb"}
                          onClick={() => {
                            setSelectedOption(option.id)
                            setIsDialogOpen(true)
                          }}
                        >
                          Select Option
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-blue-700">Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600">Supplier Name</div>
                  <div className="font-medium">{supplierData.supplierName}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Location</div>
                  <div className="font-medium">{supplierData.location}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Component Type</div>
                  <div className="font-medium">{supplierData.componentType}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Contract Value</div>
                  <div className="font-medium">${(supplierData.contractValue / 1000000).toFixed(0)}M annually</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Quality Rating</div>
                  <div className="font-medium flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {supplierData.qualityRating}/5.0
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">On-Time Delivery</div>
                  <div className="font-medium">{supplierData.onTimeDelivery}%</div>
                  <Progress value={supplierData.onTimeDelivery} className="mt-1" />
                </div>

                <div>
                  <div className="text-xs text-gray-600">Current Status</div>
                  <Badge variant="destructive" className="mt-1">
                    {supplierData.supplierStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog for resolution options */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Implement {resolutionOptions.find((o) => o.id === selectedOption)?.title}?</DialogTitle>
            <DialogDescription className="text-gray-600">
              This action will initiate the selected recovery plan. Please confirm to proceed with implementation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button variant="breadcrumb" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>Confirm Implementation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
