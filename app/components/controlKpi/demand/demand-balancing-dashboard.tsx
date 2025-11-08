
import { ArrowLeft, Package, AlertTriangle, Clock, Truck, BarChart3, Target, Users } from "lucide-react"
import { Badge } from "../../ui/badge"
import { Button } from "../../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Progress } from "../../ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { Link } from "@remix-run/react" 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog"
import { useState } from "react"
interface DemandData {
  sourceLocation: string
  materialCode: string
  revenueImpact: number
  unitImpact: number
  impactCoverage: number
  confidenceLevel: number
  predictedAction: string
  actionPriority: string
  dueDate: string
  description: string
  alertType: string
  transferLeadTime: string
  currentStock: number
  projectedDemand: number
}

interface DemandBalancingDashboardProps {
  demandData: DemandData
}

export default function DemandBalancingDashboard({ demandData }: DemandBalancingDashboardProps) {
  const stockCoverage = (demandData.currentStock / demandData.projectedDemand) * 100
  const backorderUnits = Math.max(0, demandData.projectedDemand - demandData.currentStock)
  const isHighPriority = demandData.actionPriority === "High"

  const isLowStock = demandData.actionPriority === "High" || demandData.actionPriority === "Critical"
  
  // Mock forecast data
  const forecastData = [
    { week: "Week 1", projected: 3200, actual: 3100, backorder: 100 },
    { week: "Week 2", projected: 3800, actual: 3200, backorder: 600 },
    { week: "Week 3", projected: 4200, actual: 3000, backorder: 1200 },
    { week: "Week 4", projected: 4800, actual: 2800, backorder: 2000 },
    { week: "Week 5", projected: 5200, actual: 2600, backorder: 2600 },
  ]

  // Mock inventory availability data
  const inventoryData = [
    { location: "META-CA-01", available: 12450, allocated: 8200, transit: 1500 },
    { location: "META-TX-01", available: 8920, allocated: 6500, transit: 800 },
    { location: "META-EU-01", available: 15680, allocated: 12000, transit: 2200 },
    { location: "META-APAC-01", available: 4560, allocated: 3800, transit: 600 },
  ]

  // Alternative recommendations
  const alternatives = [
    {
      title: "Option 1: Direct Transfer",
      description: "Transfer units directly from source to destination",
      cost: "$45,000",
      leadTime: "3-5 days",
      riskLevel: "Low",
      impact: "Moderate",
    },
    {
      title: "Option 2: Hub Consolidation",
      description: "Consolidate inventory through regional hub before distribution",
      cost: "$28,000",
      leadTime: "5-7 days",
      riskLevel: "Medium",
      impact: "High",
    },
    {
      title: "Option 3: Emergency Manufacturing",
      description: "Expedite manufacturing to meet demand shortfall",
      cost: "$85,000",
      leadTime: "14-21 days",
      riskLevel: "High",
      impact: "Very High",
    },
  ]
  const [isExpediteDialogOpen, setIsExpediteDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [isForecastDialogOpen, setIsForecastDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to={`/inv/demand-balancing`}>
            <Button variant="breadcrumb" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Demand Balancing
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={isHighPriority ? "destructive" : "secondary"}>{demandData.actionPriority} Priority</Badge>
            <Badge variant="outline">{demandData.alertType}</Badge>
            <span className="text-sm text-muted-foreground">Due: {demandData.dueDate}</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{demandData.materialCode}</h1>
            <p className="text-lg text-gray-600 mt-1">{demandData.sourceLocation}</p>
            <p className="text-sm text-gray-500 mt-2">{demandData.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">${(demandData.revenueImpact / 1000000).toFixed(2)}M</div>
            <div className="text-sm text-gray-500">Revenue Impact</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Coverage</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockCoverage.toFixed(2)}%</div>
            <Progress value={Number(stockCoverage.toFixed(2))} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {demandData.currentStock.toLocaleString()} / {demandData.projectedDemand.toLocaleString()} demand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Backorders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{backorderUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">units short of demand</p>
            <div className="text-sm font-medium mt-1 text-red-600">
              {((backorderUnits / demandData.projectedDemand) * 100).toFixed(1)}% shortfall
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transfer Lead Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demandData.transferLeadTime}</div>
            <p className="text-xs text-muted-foreground mt-2">estimated delivery</p>
            <div className="text-sm font-medium mt-1">{demandData.predictedAction} recommended</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demandData.confidenceLevel.toFixed(1)}%</div>
            <Progress value={demandData.confidenceLevel} className="mt-2 text-center" />
            <p className="text-xs text-muted-foreground mt-2">forecast accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="forecast">Forecast & Backorders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Availability</TabsTrigger>
          <TabsTrigger value="impact">Implementation Impact</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alert Description */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alert Description & Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2">Current Situation</h3>
                  <p className="text-sm text-orange-800">{demandData.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Impact Metrics</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Revenue at Risk:</span>
                        <span className="font-medium">${(demandData.revenueImpact / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Units Affected:</span>
                        <span className="font-medium">{demandData.unitImpact.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Coverage:</span>
                        <span className="font-medium">{demandData.impactCoverage}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Recommended Action</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Action Type:</span>
                        <span className="font-medium">{demandData.predictedAction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Priority:</span>
                        <span className="font-medium">{demandData.actionPriority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-medium">{demandData.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage this product inventory</CardDescription>
              </CardHeader>
          <CardContent className="space-y-3">
                <Dialog open={isExpediteDialogOpen} onOpenChange={setIsExpediteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant={isLowStock ? "primary" : "breadcrumb"}>
                      <Truck className="h-4 w-4 mr-2" />
                      {isLowStock ? "Transfer Shipment" : "Transfer Shipment"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {isLowStock ? "Transfer Shipment?" : "Transfer Shipment?"}
                      </DialogTitle>
                      <DialogDescription>
                        {isLowStock
                          ? `Critical stock shortage detected. This will authorize transfer of 3,000 units via air freight. Estimated cost: $45,000. Delivery time: 24-48 hours.`
                          : `Transfer shipment of 2,500 units via ground transport. Estimated cost: $8,500. Delivery time: 5-7 days.`}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Shipment Size</label>
                          <p className="text-2xl font-bold">{isLowStock ? "3,000" : "2,500"} units</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Total Cost</label>
                          <p className="text-2xl font-bold">{isLowStock ? "$45,000" : "$8,500"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Delivery Method</label>
                          <p className="font-medium">{isLowStock ? "Air Freight" : "Ground Transport"}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">ETA</label>
                          <p className="font-medium">{isLowStock ? "24-48 hours" : "5-7 days"}</p>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="breadcrumb" onClick={() => setIsExpediteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsExpediteDialogOpen(false)}>Confirm Shipment</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="breadcrumb">
                      <Users className="h-4 w-4 mr-2" />
                      Contact {demandData.sourceLocation}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Contact {demandData.sourceLocation}</DialogTitle>
                      <DialogDescription>
                        Send urgent communication regarding inventory levels and restocking requirements.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Message Type</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Inventory Alert</option>
                          <option>Restock Request</option>
                          <option>Promotional Opportunity</option>
                          <option>General Inquiry</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority Level</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>High - Immediate Response Required</option>
                          <option>Medium - Response within 24 hours</option>
                          <option>Low - Response within 3 days</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Contact Method</label>
                        <div className="flex gap-2">
                          <Button variant="breadcrumb" size="sm">
                            Email
                          </Button>
                          <Button variant="breadcrumb" size="sm">
                            Phone
                          </Button>
                          <Button variant="breadcrumb" size="sm">
                            Portal Message
                          </Button>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="breadcrumb" onClick={() => setIsContactDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsContactDialogOpen(false)}>Send Message</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isForecastDialogOpen} onOpenChange={setIsForecastDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="breadcrumb">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Update Forecast
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Update Demand Forecast</DialogTitle>
                      <DialogDescription>
                        Adjust demand projections based on current market conditions and sales trends.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Current Forecast</label>
                        <p className="text-lg font-semibold">{demandData.projectedDemand.toLocaleString()} units</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Forecast</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded-md"
                          defaultValue={demandData.projectedDemand}
                          placeholder="Enter new forecast"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Adjustment Reason</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Seasonal Demand Change</option>
                          <option>Market Trend Shift</option>
                          <option>Promotional Campaign</option>
                          <option>Competitor Activity</option>
                          <option>Supply Chain Disruption</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Confidence Level</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>High (90-95%)</option>
                          <option>Medium (75-89%)</option>
                          <option>Low (60-74%)</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="breadcrumb" onClick={() => setIsForecastDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsForecastDialogOpen(false)}>Update Forecast</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="breadcrumb">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Generate Supply Chain Report</DialogTitle>
                      <DialogDescription>
                        Create detailed analytics report for this product and distribution center.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Report Type</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Inventory Analysis</option>
                          <option>Sales Performance</option>
                          <option>Demand Forecasting</option>
                          <option>Supply Chain Efficiency</option>
                          <option>Comprehensive Overview</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time Period</label>
                        <select className="w-full p-2 border rounded-md">
                          <option>Last 7 days</option>
                          <option>Last 30 days</option>
                          <option>Last 90 days</option>
                          <option>Last 6 months</option>
                          <option>Last 12 months</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Format</label>
                        <div className="flex gap-2">
                          <Button variant="breadcrumb" size="sm">
                            PDF
                          </Button>
                          <Button variant="breadcrumb" size="sm">
                            Excel
                          </Button>
                          <Button variant="breadcrumb" size="sm">
                            CSV
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Recipients</label>
                        <input
                          type="email"
                          className="w-full p-2 border rounded-md"
                          placeholder="Enter email addresses"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="breadcrumb" onClick={() => setIsReportDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsReportDialogOpen(false)}>Generate & Send</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Projected Backorders vs Forecast</CardTitle>
                <CardDescription>5-week demand projection and backorder accumulation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Line
                        type="monotone"
                        dataKey="projected"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Projected Demand"
                      />
                      <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual Inventory" />
                      <Line type="monotone" dataKey="backorder" stroke="#ef4444" strokeWidth={2} name="Backorders" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-blue-600 font-medium">Projected Demand</div>
                    <div className="text-2xl font-bold">21,200</div>
                    <div className="text-gray-500">5-week total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-medium">Available Inventory</div>
                    <div className="text-2xl font-bold">14,700</div>
                    <div className="text-gray-500">current + pipeline</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-600 font-medium">Projected Backorders</div>
                    <div className="text-2xl font-bold">6,500</div>
                    <div className="text-gray-500">units short</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projected Inventory Levels</CardTitle>
                <CardDescription>Inventory projection with and without intervention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2">Without Action</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stock Depletion:</span>
                        <span className="font-medium ml-2">Week 3</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Backorders:</span>
                        <span className="font-medium ml-2">8,200 units</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue Loss:</span>
                        <span className="font-medium ml-2">${(demandData.revenueImpact / 1000000).toFixed(2)}M</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Recovery Time:</span>
                        <span className="font-medium ml-2">6-8 weeks</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">With Recommended Action</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stock Stabilization:</span>
                        <span className="font-medium ml-2">Week 2</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reduced Backorders:</span>
                        <span className="font-medium ml-2">2,100 units</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Revenue Protected:</span>
                        <span className="font-medium ml-2">
                          ${((demandData.revenueImpact * 0.75) / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Recovery Time:</span>
                        <span className="font-medium ml-2">2-3 weeks</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Availability Across Locations</CardTitle>
              <CardDescription>Current stock levels and allocation status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryData.map((location, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{location.location}</h4>
                      <Badge variant="outline">
                        {((location.available / (location.available + location.allocated)) * 100).toFixed(0)}% Available
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Available</div>
                        <div className="text-lg font-bold text-green-600">{location.available.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Allocated</div>
                        <div className="text-lg font-bold text-blue-600">{location.allocated.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">In Transit</div>
                        <div className="text-lg font-bold text-orange-600">{location.transit.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 rounded-l-full h-2"
                          style={{
                            width: `${(location.available / (location.available + location.allocated + location.transit)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-blue-500 h-2"
                          style={{
                            width: `${(location.allocated / (location.available + location.allocated + location.transit)) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-orange-500 rounded-r-full h-2"
                          style={{
                            width: `${(location.transit / (location.available + location.allocated + location.transit)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Implementation Impact Analysis</CardTitle>
                <CardDescription>Expected outcomes of executing the recommended action</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700 font-medium">Operational Impact</div>
                    <div className="text-2xl font-bold text-blue-900">+75%</div>
                    <div className="text-xs text-blue-600">fulfillment improvement</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700 font-medium">Revenue Protection</div>
                    <div className="text-2xl font-bold text-green-900">$3.2M</div>
                    <div className="text-xs text-green-600">revenue secured</div>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm text-orange-700 font-medium">Customer Impact</div>
                    <div className="text-2xl font-bold text-orange-900">-60%</div>
                    <div className="text-xs text-orange-600">backorder reduction</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-700 font-medium">Lead Time</div>
                    <div className="text-2xl font-bold text-purple-900">{demandData.transferLeadTime}</div>
                    <div className="text-xs text-purple-600">to implementation</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Key Benefits</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Immediate reduction in projected backorders
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Improved customer satisfaction and retention
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Optimized inventory distribution across regions
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      Enhanced supply chain resilience
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Potential risks and mitigation strategies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 border-l-4 border-yellow-400 bg-yellow-50">
                    <div className="font-medium text-yellow-800">Medium Risk</div>
                    <div className="text-sm text-yellow-700">Transportation delays due to weather</div>
                    <div className="text-xs text-yellow-600 mt-1">
                      Mitigation: Alternative routing options available
                    </div>
                  </div>

                  <div className="p-3 border-l-4 border-orange-400 bg-orange-50">
                    <div className="font-medium text-orange-800">Medium Risk</div>
                    <div className="text-sm text-orange-700">Source location stock depletion</div>
                    <div className="text-xs text-orange-600 mt-1">Mitigation: Maintain 20% safety stock buffer</div>
                  </div>

                  <div className="p-3 border-l-4 border-green-400 bg-green-50">
                    <div className="font-medium text-green-800">Low Risk</div>
                    <div className="text-sm text-green-700">Demand forecast accuracy</div>
                    <div className="text-xs text-green-600 mt-1">
                      Confidence level: {demandData.confidenceLevel.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Success Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Backorder Reduction Target:</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>On-Time Delivery Target:</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Satisfaction:</span>
                      <span className="font-medium">4.5/5.0</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alternatives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alternative Recommendations</CardTitle>
              <CardDescription>Explore different approaches to address the demand imbalance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {alternatives.map((option, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${index === 0 ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-sm">{option.title}</h3>
                        {index === 0 && <Badge className="mt-1 text-xs">Recommended</Badge>}
                      </div>

                      <p className="text-xs text-gray-700">{option.description}</p>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-medium">{option.cost}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Lead Time:</span>
                          <span className="font-medium">{option.leadTime}</span>
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
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Impact:</span>
                          <Badge
                            variant={
                              option.impact === "Very High"
                                ? "default"
                                : option.impact === "High"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {option.impact}
                          </Badge>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className={`w-full text-xs ${index === 0 ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                        variant={index === 0 ? "primary" : "breadcrumb"}
                      >
                        Select Option
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
