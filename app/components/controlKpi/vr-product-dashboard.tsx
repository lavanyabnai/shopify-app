
import {
  ArrowLeft,
  Package,
  TrendingUp,
  AlertTriangle,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Truck,
  BarChart3,
} from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Link, useParams } from "@remix-run/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import { useState } from "react"


interface ProductData {
  distributionCenter: string
  productModel: string
  sku: string
  currentStock: number
  forecastDemand: number
  retailPartner: string
  region: string
  alertType: string
  daysOfInventory: number
  lastShipment: string
  nextShipment: string
  salesVelocity: string
  retailPrice: string
  priority: string
}

interface VRProductDashboardProps {
  productData: ProductData
}

export default function VRProductDashboard({ productData }: VRProductDashboardProps) {
  const stockPercentage = (productData.currentStock / productData.forecastDemand) * 100
  const isLowStock = productData.priority === "high" || productData.priority === "critical"
  const params = useParams()
  const workspaceId = params.workspaceId as string
  // Mock additional data for dashboard
  const weeklyData = [
    { week: "Week 1", sales: 1200, returns: 45 },
    { week: "Week 2", sales: 1450, returns: 32 },
    { week: "Week 3", sales: 1680, returns: 28 },
    { week: "Week 4", sales: 1520, returns: 41 },
  ]

  const regionalBreakdown = [
    { store: "Best Buy - Los Angeles", stock: 450, sales: 89 },
    { store: "Best Buy - San Francisco", stock: 320, sales: 76 },
    { store: "Best Buy - San Diego", stock: 280, sales: 65 },
    { store: "Best Buy - Sacramento", stock: 190, sales: 43 },
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
          <Link to={`/workspaces/${workspaceId}/controlKpi/finishGoods`}>
            <Button variant="breadcrumb" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inventory
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={isLowStock ? "destructive" : "secondary"}>{productData.alertType}</Badge>
            <span className="text-sm text-muted-foreground">Last updated: 2 hours ago</span>
          </div>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{productData.productModel}</h1>
            <p className="text-lg text-gray-600 mt-1">{productData.distributionCenter}</p>
            <p className="text-sm text-gray-500">
              SKU: {productData.sku} • {productData.region}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{productData.currentStock.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Units Available</div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock vs Forecast</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockPercentage.toFixed(2)}%</div>
              {/* <Progress value={Number(stockPercentage.toFixed(2))} className="mt-2" indicatorColor="bg-blue-500" /> */}
            <p className="text-xs text-muted-foreground mt-2">
              {productData.currentStock.toLocaleString()} / {productData.forecastDemand.toLocaleString()} forecasted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{productData.salesVelocity}</div>
            <p className="text-xs text-muted-foreground mt-2">vs previous month</p>
            <div className="text-sm font-medium mt-1">
              ~{Math.round(productData.currentStock / productData.daysOfInventory)} units/day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days of Inventory</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productData.daysOfInventory}</div>
            <p className="text-xs text-muted-foreground mt-2">days remaining</p>
            <div className="text-sm font-medium mt-1">
              {productData.daysOfInventory < 20 ? "⚠️ Low coverage" : "✅ Good coverage"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retail Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productData.retailPrice}</div>
            <p className="text-xs text-muted-foreground mt-2">Current MSRP</p>
            <div className="text-sm font-medium mt-1 text-green-600">+2.1% margin</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Flow</TabsTrigger>
          <TabsTrigger value="retail">Retail Performance</TabsTrigger>
          <TabsTrigger value="logistics">Logistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inventory Status */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Inventory Trend (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2 p-4 bg-gray-50 rounded-lg">
                  {[15200, 14800, 14200, 13800, 13200, 12800, 12450].map((value, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div
                        className="bg-blue-500 rounded-t w-8 transition-all hover:bg-blue-600"
                        style={{ height: `${(value / 15200) * 200}px` }}
                      />
                      <span className="text-xs text-gray-500">
                        {new Date(Date.now() - (6 - index) * 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-gray-500">Steady decline due to strong sales</span>
                  <span className="font-medium">-18% over 30 days</span>
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
                      {isLowStock ? "Expedite Shipment" : "Schedule Shipment"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>
                        {isLowStock ? "Expedite Emergency Shipment?" : "Schedule Standard Shipment?"}
                      </DialogTitle>
                      <DialogDescription>
                        {isLowStock
                          ? `Critical stock shortage detected. This will authorize emergency shipment of 3,000 units via air freight. Estimated cost: $45,000. Delivery time: 24-48 hours.`
                          : `Schedule standard shipment of 2,500 units via ground transport. Estimated cost: $8,500. Delivery time: 5-7 days.`}
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
                      Contact {productData.retailPartner}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Contact {productData.retailPartner}</DialogTitle>
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
                        <p className="text-lg font-semibold">{productData.forecastDemand.toLocaleString()} units</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">New Forecast</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded-md"
                          defaultValue={productData.forecastDemand}
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium">Shipment received from manufacturing</p>
                    <p className="text-sm text-gray-500">2,500 units • {productData.lastShipment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium">Distributed to {productData.retailPartner}</p>
                    <p className="text-sm text-gray-500">1,200 units • Jan 13, 2025</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <div className="flex-1">
                    <p className="font-medium">Low stock alert triggered</p>
                    <p className="text-sm text-gray-500">Below reorder threshold • Jan 12, 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Inbound Shipments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Manufacturing → Distribution Center</p>
                      <p className="text-sm text-gray-500">3,000 units expected</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{productData.nextShipment}</p>
                      <Badge variant="outline">In Transit</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Emergency Restock</p>
                      <p className="text-sm text-gray-500">1,500 units planned</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Jan 25, 2025</p>
                      <Badge variant="secondary">Scheduled</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Outbound Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {regionalBreakdown.map((store, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{store.store}</p>
                        <p className="text-sm text-gray-500">{store.stock} units in stock</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{store.sales} sold/week</p>
                        <p className="text-sm text-gray-500">{Math.round(store.stock / store.sales)} weeks left</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="retail" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Sales Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyData.map((week, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{week.week}</p>
                        <p className="text-sm text-gray-500">{week.returns} returns</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{week.sales} units sold</p>
                        <p className="text-sm text-green-600">
                          {index > 0
                            ? `+${(((week.sales - weeklyData[index - 1].sales) / weeklyData[index - 1].sales) * 100).toFixed(1)}%`
                            : "Baseline"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retail Partner Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{productData.retailPartner}</p>
                    <p className="text-sm text-gray-500">Primary retail partner</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-gray-500">Contract Terms</p>
                    <p className="font-medium">Net 30</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Margin</p>
                    <p className="font-medium">22%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Min Order</p>
                    <p className="font-medium">500 units</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Lead Time</p>
                    <p className="font-medium">3-5 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logistics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Distribution Network
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="font-medium">Primary Hub</p>
                    <p className="text-sm text-gray-600">{productData.distributionCenter}</p>
                    <p className="text-sm text-gray-500 mt-1">Serves {productData.region}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-gray-500">Avg Shipping Time</p>
                      <p className="font-medium">2.3 days</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-gray-500">Shipping Cost</p>
                      <p className="font-medium">$12.50/unit</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transportation Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Next Delivery</p>
                      <p className="text-sm text-gray-500">To retail locations</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Tomorrow</p>
                      <p className="text-sm text-green-600">On Schedule</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium">Inbound Freight</p>
                      <p className="text-sm text-gray-500">From manufacturing</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{productData.nextShipment}</p>
                      <p className="text-sm text-yellow-600">In Transit</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
