import { useState } from "react"
import {
  Clock,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  CheckCircle,
  ArrowLeft,
  RotateCcw,
  Star,
  Users,
  FileText,
  Wrench,
} from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
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

interface RMAData {
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

interface ReturnsRMADashboardProps {
  rmaData: RMAData
}

export default function ReturnsRMADashboard({ rmaData }: ReturnsRMADashboardProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const isCritical = rmaData.priority === "Critical"

  // Mock data for charts and analysis
  const returnTrendData = [
    { week: "Week 1", returns: 180, rate: 2.1 },
    { week: "Week 2", returns: 245, rate: 3.2 },
    { week: "Week 3", returns: 320, rate: 4.8 },
    { week: "Week 4", returns: 485, rate: 6.9 },
    { week: "Week 5", returns: 650, rate: 8.5 },
  ]

  const defectBreakdown = [
    { category: "Display Issues", count: 450, percentage: 36 },
    { category: "Controller Problems", count: 320, percentage: 26 },
    { category: "Audio Defects", count: 280, percentage: 22 },
    { category: "Tracking Issues", count: 200, percentage: 16 },
  ]

  const batchAnalysis = [
    { batch: "QB3-2024-Q4-001", returns: 1250, rate: 8.5, status: "Critical" },
    { batch: "QB3-2024-Q3-008", returns: 890, rate: 6.2, status: "High" },
    { batch: "QB3-2024-Q3-005", returns: 650, rate: 4.8, status: "Medium" },
    { batch: "QB3-2024-Q2-012", returns: 420, rate: 3.1, status: "Low" },
  ]

  const resolutionActions = [
    {
      id: 1,
      title: "Immediate Recall & Replacement",
      recommended: false,
      details: [
        "• Initiate voluntary recall for affected batch",
        "• Provide immediate replacements",
        "• Recovery time: 2-3 weeks",
      ],
      cost: "$2,850,000",
      customerImpact: "High Satisfaction",
      riskLevel: "Low",
    },
    {
      id: 2,
      title: "Targeted Quality Fix",
      recommended: true,
      details: [
        "• Implement quality fix for root cause",
        "• Offer repair service for existing units",
        "• Recovery time: 1-2 weeks",
      ],
      cost: "$1,200,000",
      customerImpact: "Moderate Satisfaction",
      riskLevel: "Medium",
    },
    {
      id: 3,
      title: "Software Update Solution",
      recommended: false,
      details: [
        "• Deploy software patch to mitigate issue",
        "• Monitor effectiveness over time",
        "• Recovery time: 3-5 days",
      ],
      cost: "$450,000",
      customerImpact: "Variable Satisfaction",
      riskLevel: "High",
    },
  ]

  const rmaProcessSteps = [
    { step: "Customer Report", status: "Completed", date: "Jan 10, 2025" },
    { step: "Initial Assessment", status: "Completed", date: "Jan 12, 2025" },
    { step: "Defect Analysis", status: "In Progress", date: "Jan 15, 2025" },
    { step: "Root Cause Investigation", status: "Pending", date: "Jan 18, 2025" },
    { step: "Resolution Implementation", status: "Pending", date: "Jan 22, 2025" },
    { step: "Customer Communication", status: "Pending", date: "Jan 25, 2025" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link to={`/inv/returns-rma`}>
              <Button variant="breadcrumb" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Returns & RMA
              </Button>
            </Link>
            <h1 className="text-xl font-semibold text-blue-900">RMA Alert: {rmaData.returnReason}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isCritical ? "destructive" : "secondary"}>{rmaData.priority} Priority</Badge>
            <Badge variant="outline">{rmaData.alertType}</Badge>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-10 w-64" placeholder="Search..." />
            </div>
            <Button variant="primary" className="flex items-center">
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
                      <span className="text-red-900 font-semibold">CRITICAL RMA ALERT:</span>
                      <span className="text-red-800">
                        {rmaData.productModel} - {rmaData.returnReason} ({rmaData.returnRate}% Return Rate)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Return Rate</div>
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-3xl font-bold text-red-600">{rmaData.returnRate}%</span>
                      <Badge variant="destructive" className="text-xs">
                        High
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Above 5% threshold</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Processing Time</div>
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-3xl font-bold text-orange-600">{rmaData.processingTime}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Current estimate</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Return Quantity</div>
                    <div className="flex items-center justify-center space-x-1">
                      <Package className="h-4 w-4 text-blue-500" />
                      <span className="text-3xl font-bold text-blue-600">
                        {rmaData.returnQuantity.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">units affected</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-1">Quality Score</div>
                    <div className="flex items-center justify-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-3xl font-bold text-yellow-600">{rmaData.qualityScore}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">out of 5.0</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analysis">Defect Analysis</TabsTrigger>
                <TabsTrigger value="process">RMA Process</TabsTrigger>
                <TabsTrigger value="resolution">Resolution</TabsTrigger>
                <TabsTrigger value="impact">Impact Assessment</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Alert Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-orange-700">RMA Alert Details & Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700">
                        RMA {rmaData.rmaNumber} has been triggered due to {rmaData.returnReason.toLowerCase()} issues
                        affecting {rmaData.productModel}. Current return rate of {rmaData.returnRate}% significantly
                        exceeds the acceptable threshold of 5%, with {rmaData.returnQuantity.toLocaleString()} units
                        affected from batch {rmaData.batchNumber}.
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Financial Impact</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Estimated Cost:</span>
                              <span className="font-medium">${(rmaData.estimatedCost / 1000000).toFixed(2)}M</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Warranty Status:</span>
                              <span className="font-medium">{rmaData.warrantyStatus}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Customer Type:</span>
                              <span className="font-medium">{rmaData.customerType}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Product Information</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Batch Number:</span>
                              <span className="font-medium">{rmaData.batchNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Manufacturing Date:</span>
                              <span className="font-medium">{rmaData.manufacturingDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Supplier Impact:</span>
                              <span className="font-medium">{rmaData.supplierImpact}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Return Trend Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span>Return Rate Trend</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={returnTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="week"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: "#6b7280" }}
                            />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
                            <Line
                              type="monotone"
                              dataKey="rate"
                              stroke="#ef4444"
                              strokeWidth={2}
                              dot={{ fill: "#ef4444", r: 4 }}
                              name="Return Rate %"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="text-red-600 font-medium">Current Trend</div>
                        <div className="text-2xl font-bold text-red-600">+305% increase</div>
                        <div className="text-gray-500">over 5 weeks</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <Package className="h-4 w-4 text-blue-500" />
                        <span>Defect Category Breakdown</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {defectBreakdown.map((defect, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>{defect.category}</span>
                              <span className="text-gray-600">
                                {defect.count} units ({defect.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${defect.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6">
                {/* Batch Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span>Batch Analysis & Root Cause</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-medium text-red-900 mb-2">Root Cause Analysis</h4>
                        <p className="text-sm text-red-800">
                          Primary root cause identified as: <strong>{rmaData.rootCause}</strong>
                        </p>
                        <p className="text-sm text-red-700 mt-2">
                          Investigation shows quality control issues during manufacturing process at{" "}
                          {rmaData.supplierImpact} facility. Defect appears to be systematic across the entire batch{" "}
                          {rmaData.batchNumber}.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Affected Batch Comparison</h4>
                        {batchAnalysis.map((batch, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{batch.batch}</span>
                              <Badge
                                variant={
                                  batch.status === "Critical"
                                    ? "destructive"
                                    : batch.status === "High"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {batch.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Returns: </span>
                                <span className="font-medium">{batch.returns.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Rate: </span>
                                <span className="font-medium">{batch.rate}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="process" className="space-y-6">
                {/* RMA Process Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <RotateCcw className="h-4 w-4 text-blue-500" />
                      <span>RMA Process Timeline</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {rmaProcessSteps.map((step, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              step.status === "Completed"
                                ? "bg-green-500"
                                : step.status === "In Progress"
                                  ? "bg-blue-500"
                                  : "bg-gray-300"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{step.step}</span>
                              <span className="text-sm text-gray-500">{step.date}</span>
                            </div>
                            <Badge
                              variant={
                                step.status === "Completed"
                                  ? "outline"
                                  : step.status === "In Progress"
                                    ? "default"
                                    : "secondary"
                              }
                              className="mt-1 text-xs"
                            >
                              {step.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resolution" className="space-y-6">
                {/* Resolution Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>Resolution Action Plans</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {resolutionActions.map((action) => (
                        <div
                          key={action.id}
                          className={`p-4 border rounded-lg ${action.recommended ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                        >
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-medium text-sm">{action.title}</h3>
                              {action.recommended && <Badge className="mt-1 text-xs">Recommended</Badge>}
                            </div>

                            <div className="space-y-1">
                              {action.details.map((detail, index) => (
                                <div key={index} className="text-xs text-gray-700">
                                  {detail}
                                </div>
                              ))}
                            </div>

                            <div className="space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Cost:</span>
                                <span className="font-medium">{action.cost}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Customer Impact:</span>
                                <Badge
                                  variant={
                                    action.customerImpact === "High Satisfaction"
                                      ? "default"
                                      : action.customerImpact === "Moderate Satisfaction"
                                        ? "secondary"
                                        : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {action.customerImpact}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Risk Level:</span>
                                <Badge
                                  variant={
                                    action.riskLevel === "Low"
                                      ? "outline"
                                      : action.riskLevel === "Medium"
                                        ? "secondary"
                                        : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {action.riskLevel}
                                </Badge>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className={`w-full text-xs ${action.recommended ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                              variant={action.recommended ? "primary" : "breadcrumb"}
                              onClick={() => {
                                setSelectedOption(action.id)
                                setIsDialogOpen(true)
                              }}
                            >
                              Select Action
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="impact" className="space-y-6">
                {/* Impact Assessment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-blue-500" />
                        <span>Customer Impact Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="text-sm text-red-700 font-medium">Customer Satisfaction</div>
                          <div className="text-2xl font-bold text-red-900">{rmaData.qualityScore}/5.0</div>
                          <div className="text-xs text-red-600">-1.8 point decline</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="text-sm text-orange-700 font-medium">Brand Impact</div>
                          <div className="text-2xl font-bold text-orange-900">High</div>
                          <div className="text-xs text-orange-600">reputation risk</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Key Impact Areas</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            Customer trust and loyalty degradation
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            Increased support ticket volume (+45%)
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            Potential media coverage and PR issues
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            Retailer relationship strain
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <Wrench className="h-4 w-4 text-blue-500" />
                        <span>Operational Impact</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="text-sm text-blue-700 font-medium">Processing Capacity</div>
                          <div className="text-2xl font-bold text-blue-900">85%</div>
                          <div className="text-xs text-blue-600">of normal capacity</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm text-purple-700 font-medium">Resource Allocation</div>
                          <div className="text-2xl font-bold text-purple-900">+60%</div>
                          <div className="text-xs text-purple-600">additional resources</div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">Operational Challenges</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            Increased RMA processing workload
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            Quality assurance team overload
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                            Supplier relationship management
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            Inventory management complexity
                          </li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-blue-700">RMA Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-xs text-gray-600">RMA Number</div>
                  <div className="font-medium">{rmaData.rmaNumber}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Product Model</div>
                  <div className="font-medium">{rmaData.productModel}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Return Reason</div>
                  <div className="font-medium">{rmaData.returnReason}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Defect Category</div>
                  <div className="font-medium">{rmaData.defectCategory}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Customer Type</div>
                  <div className="font-medium">{rmaData.customerType}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Region</div>
                  <div className="font-medium">{rmaData.region}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Warranty Status</div>
                  <Badge variant="outline" className="mt-1">
                    {rmaData.warrantyStatus}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Resolution Status</div>
                  <Badge variant="secondary" className="mt-1">
                    {rmaData.resolutionStatus}
                  </Badge>
                </div>

                <div>
                  <div className="text-xs text-gray-600">Due Date</div>
                  <div className="font-medium">{rmaData.dueDate}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Dialog for resolution actions */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Implement {resolutionActions.find((a) => a.id === selectedOption)?.title}?</DialogTitle>
            <DialogDescription className="text-gray-600">
              This action will initiate the selected resolution plan for RMA {rmaData.rmaNumber}. Please confirm to
              proceed with implementation.
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
