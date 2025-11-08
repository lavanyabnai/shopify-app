import { type ComponentType, useState } from "react"
import { Link } from "@remix-run/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import {
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  Users,
  Truck,
  Factory,
  Building2,
  Package,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
} from "lucide-react"
import { Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../components/ui/chart"


const otifTreeData = {
  totalLoss: 100,
  modules: [
    {
      id: 1,
      name: "Customer & Demand",
      percentage: 10,
      icon: Users,
      color: "bg-purple-600",
      borderColor: "border-purple-300",
      textColor: "text-purple-800",
      bgColor: "bg-purple-50",
      kpis: [
        { name: "Sales SKOT", current: ">50%", target: ">90%" },
        { name: "Forecast accuracy", current: ">70%", target: "75%" },
        { name: "Forecast bias", current: "<5%", target: "<3%" },
      ],
      reasons: [
        {
          name: "Forecast Accuracy",
          percentage: 10,
          module: "M2: Demand planning and S&OP",
        },
      ],
    },
    {
      id: 2,
      name: "Distribution Loss",
      percentage: 76,
      icon: Truck,
      color: "bg-red-600",
      borderColor: "border-red-300",
      textColor: "text-red-800",
      bgColor: "bg-red-50",
      kpis: [
        { name: "FG Inventory", current: "<4 wks", target: "<3 wks" },
        { name: "Dispatch compliance", current: ">90%", target: ">95%" },
        { name: "Dispatch Coverage Plan", current: "85%", target: "95%" },
      ],
      reasons: [
        {
          name: "DC Replenishment Loss",
          percentage: 55,
          module: "M4: Inventory and distribution planning",
        },
        {
          name: "Plant Dispatch Planning",
          percentage: 10,
          module: "M4: Inventory and distribution planning",
        },
        {
          name: "Plant Dispatch Compliance",
          percentage: 9,
          module: "M4: Inventory and distribution planning",
        },
      ],
    },
    {
      id: 3,
      name: "Supply Loss",
      percentage: 14,
      icon: Factory,
      color: "bg-green-600",
      borderColor: "border-green-300",
      textColor: "text-green-800",
      bgColor: "bg-green-50",
      kpis: [
        { name: "Production compliance", current: ">95%", target: ">98%" },
        { name: "Frozen period", current: "<1 wk", target: "<3 days" },
        { name: "Supplier OTIF", current: ">85%", target: ">90%" },
      ],
      reasons: [
        {
          name: "Plant Production Scheduling",
          percentage: 4,
          module: "M5: Manufacturing planning",
        },
        {
          name: "Plant Capacity",
          percentage: 5,
          module: "M5: Manufacturing planning",
        },
        {
          name: "Production Execution",
          percentage: 7,
          module: "M5: Manufacturing planning",
        },
      ],
    },
  ],
}

const benefitsData = [
  { metric: "OTIF Performance", baseline: 85, current: 92, target: 95 },
  { metric: "Sales Growth", baseline: 0, current: 3, target: 5 },
  { metric: "Inventory Reduction", baseline: 0, current: -2, target: -5 },
]

const otifTrendData = [
  { month: "Jan", baseline: 85, current: 87 },
  { month: "Feb", baseline: 85, current: 88 },
  { month: "Mar", baseline: 85, current: 89 },
  { month: "Apr", baseline: 85, current: 90 },
  { month: "May", baseline: 85, current: 91 },
  { month: "Jun", baseline: 85, current: 92 },
]

type ControlTowerModuleStatus = "critical" | "warning" | "normal"

type ControlTowerModule = {
  id: number
  name: string
  description: string
  icon: ComponentType<{ className?: string }>
  color: string
  bgColor: string
  borderColor: string
  textColor: string
  alerts: number
  status: ControlTowerModuleStatus
  kpi: string
  href: string
}

export default function ControlTowerDashboard() {
  const [selectedModule, setSelectedModule] = useState<number | null>(null)
  const [selectedControlModule, setSelectedControlModule] = useState<number | null>(null)


const controlTowerModules: ControlTowerModule[] = [
  {
    id: 1,
    name: "Customer Forecast Demand",
    description: "Orders > Customer allocated forecast",
    icon: BarChart3,
    color: "bg-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    textColor: "text-blue-800",
    alerts: 12,
    status: "warning",
    kpi: "Forecast Accuracy: 70%",
    href: `/inv/demand-balancing`,
  },
  {
    id: 2,
    name: "Finished Goods",
    description: "FG Coverage",
    icon: Truck,
    color: "bg-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-300",
    textColor: "text-red-800",
    alerts: 22,
    status: "critical",
    kpi: "FG Coverage: 78%",
    href: `/inv/finishGoods`,
  },
  {
    id: 3,
    name: "Customer Receipt",
    description: "Customer OTIF",
    icon: Users,
    color: "bg-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    textColor: "text-indigo-800",
    alerts: 18,
    status: "warning",
    kpi: "Customer OTIF: 92%",
    href: `/inv/custReceipt`,
  },
  
  {
    id: 4,
    name: "Manufacturing",
    description: "Production OTIF",
    icon: Factory,
    color: "bg-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    textColor: "text-orange-800",
    alerts: 6,
    status: "normal",
    kpi: "Production OTIF: 95%",
    href: `/inv/manfDash`,
  },
  {
    id: 5,
    name: "Supplier",
    description: "Supplier OTIF",
    icon: Building2,
    color: "bg-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    textColor: "text-green-800",
    alerts: 8,
    status: "normal",
    kpi: "Supplier OTIF: 85%",
    href: `/inv/supplier-alerts`,
  },
  {
    id: 6,
    name: "Raw Materials",
    description: "RM Coverage",
    icon: Package,
    color: "bg-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    textColor: "text-purple-800",
    alerts: 15,
    status: "critical",
    kpi: "RM Coverage: 65%",
    href: `/inv/raw-material`,
  },
]

  const handleControlTowerModuleClick = (moduleId: number) => {
    setSelectedControlModule((current) => (current === moduleId ? null : moduleId))
  }

  const selectedControlTowerModule =
    selectedControlModule !== null
      ? controlTowerModules.find((module) => module.id === selectedControlModule) ?? null
      : null

  const recommendedActionsForSelectedModule = selectedControlTowerModule
    ? getRecommendedActions(selectedControlTowerModule.status)
    : []

  const handleModuleClick = (moduleId: number) => {
    setSelectedModule(moduleId)
    console.log(`Navigate to module ${moduleId} control tower`)
  }

  const getStatusColor = (status: ControlTowerModuleStatus) => {
    switch (status) {
      case "critical":
        return "bg-red-500"
      case "warning":
        return "bg-yellow-500"
      case "normal":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: ControlTowerModuleStatus) => {
    switch (status) {
      case "critical":
        return "Critical"
      case "warning":
        return "Warning"
      case "normal":
        return "Normal"
      default:
        return status
    }
  }

  function getRecommendedActions(status: ControlTowerModuleStatus): string[] {
    switch (status) {
      case "critical":
        return [
          "Escalate to control tower lead",
          "Trigger expedited fulfillment or replenishment plan",
          "Communicate customer impact and mitigation timeline",
        ]
      case "warning":
        return [
          "Validate forecasts and adjust safety stock",
          "Review open orders against capacity plans",
          "Schedule follow-up review with operations team",
        ]
      case "normal":
      default:
        return [
          "Monitor KPIs for early trend changes",
          "Review automation rules for further optimization",
          "Log learnings in control tower playbook",
        ]
    }
  }

  const totalAlerts = controlTowerModules.reduce((sum, module) => sum + module.alerts, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Supply Chain Control Tower</h1>
          <p className="text-lg text-gray-600">Early Warning System & Performance Dashboard</p>
        </div>

        {/* Updated Key Metrics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">OTIF Performance</p>
                  <p className="text-2xl font-bold text-blue-600">92%</p>
                </div>
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Target: 95%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fill Rate</p>
                  <p className="text-2xl font-bold text-green-600">87%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Target: 90%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Service Level</p>
                  <p className="text-2xl font-bold text-purple-600">94%</p>
                </div>
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Target: 96%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Perfect Order</p>
                  <p className="text-2xl font-bold text-orange-600">89%</p>
                </div>
                <Package className="h-8 w-8 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Target: 92%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">OTIF Loss</p>
                  <p className="text-2xl font-bold text-red-600">8%</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Critical threshold</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="control-alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="control-alerts">Control Tower Alerts</TabsTrigger>
            <TabsTrigger value="otif-tree">OTIF Loss Tree</TabsTrigger>
            <TabsTrigger value="kpis">Supply Chain KPIs</TabsTrigger>
            <TabsTrigger value="benefits">Benefits & Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="control-alerts" className="space-y-6">
            {/* Control Tower Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Control Tower Early Warning Sensors
                </CardTitle>
                <CardDescription>
                  Click on any module to view detailed alerts and take corrective actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* War Room Center */}
                <div className="flex justify-center mb-8">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-gray-400 rounded-2xl p-6 shadow-lg">
                    <div className="text-center space-y-3">
                      <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto" />
                      <h3 className="text-xl font-bold text-gray-900">War Room</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-700">Total Alerts: {totalAlerts}</p>
                        <div className="flex justify-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs">Critical</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs">Warning</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs">Normal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Supply Chain Flow Modules */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {controlTowerModules.map((module, index) => (
                    <Card
                      key={module.id}
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${module.borderColor} ${
                        selectedControlModule === module.id ? "ring-2 ring-blue-500" : ""
                      }`}
                      onClick={() => handleControlTowerModuleClick(module.id)}
                    >
                      <CardContent className={`p-6 ${module.bgColor} relative`}>
                        {/* Status Indicator */}
                        <div className="absolute top-3 right-3">
                          <div className={`w-3 h-3 ${getStatusColor(module.status)} rounded-full animate-pulse`}></div>
                        </div>

                        {/* Module Number */}
                        <div className="absolute top-3 left-3">
                          <div
                            className={`${module.color} text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold`}
                          >
                            {index + 1}
                          </div>
                        </div>

                        <div className="mt-8 space-y-4">
                          {/* Icon and Title */}
                          <div className="text-center">
                            <div className={`${module.color} text-white rounded-2xl p-4 inline-block mb-3`}>
                              <module.icon className="h-8 w-8" />
                            </div>
                            <h3 className={`text-lg font-bold ${module.textColor}`}>{module.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          </div>

                          {/* KPI */}
                          <div className="text-center">
                            <p className="text-sm font-semibold text-gray-700">{module.kpi}</p>
                          </div>

                          {/* Alerts Count */}
                          <div className="text-center">
                            <Badge className={`${module.color} text-white`}>{module.alerts} Active Alerts</Badge>
                          </div>

                          {/* Action Indicator */}
                          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                            <ArrowRight className="h-3 w-3" />
                            <span>Click for alert details</span>
                          </div>

                          <div className="text-center">
                            <Link
                              to={module.href}
                              className="text-sm font-semibold text-blue-600 hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              Open module dashboard
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Flow Indicators */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">Early Warning Actions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Re-allocate/prioritize customer orders</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Expedite; find alternate supplier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Adjust RM portfolio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Address production issues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Adjust FG portfolio</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Expedite order; alert client of delay</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Module Alert Details */}
            {selectedControlTowerModule && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedControlTowerModule.name} - Alert Details
                  </CardTitle>
                  <CardDescription>{selectedControlTowerModule.description}</CardDescription>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge className={`${selectedControlTowerModule.color} text-white`}>
                      {selectedControlTowerModule.alerts} Active Alerts
                    </Badge>
                    <Badge className={`${getStatusColor(selectedControlTowerModule.status)} text-white`}>
                      {getStatusLabel(selectedControlTowerModule.status)}
                    </Badge>
                    <Badge variant="outline" className="font-semibold">
                      {selectedControlTowerModule.kpi}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 font-semibold">Snapshot</h4>
                        <p className="text-sm text-gray-600">
                          {selectedControlTowerModule.alerts} alerts currently require attention in this module.
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Primary KPI
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
                            {selectedControlTowerModule.kpi}
                          </div>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Current Status
                          </div>
                          <div className="text-sm font-semibold text-gray-800">
                            {getStatusLabel(selectedControlTowerModule.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold">Recommended Actions</h4>
                      <div className="space-y-2">
                        {recommendedActionsForSelectedModule.map((action) => (
                          <div
                            key={action}
                            className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
                          >
                            {action}
                          </div>
                        ))}
                      </div>
                      <div>
                        <Link
                          to={selectedControlTowerModule.href}
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          Jump to full module dashboard
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="otif-tree" className="space-y-6">
            {/* Horizontal OTIF Tree */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  OTIF Loss Tree - Root Cause Analysis
                </CardTitle>
                <CardDescription>Horizontal flow showing loss modules and their contributing factors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-x-auto">
                  <div className="flex items-center gap-8 min-w-max p-8">
                    {/* Central OTIF Loss Node */}
                    <div className="flex flex-col items-center">
                      <div className="bg-gradient-to-br from-red-100 to-red-200 border-4 border-red-400 rounded-2xl p-6 shadow-lg min-w-[200px]">
                        <div className="text-center space-y-3">
                          <h3 className="text-xl font-bold text-red-900">OTIF Loss</h3>
                          <div className="relative">
                            <p className="text-5xl font-black text-red-700 leading-none">{otifTreeData.totalLoss}%</p>
                            <div className="absolute -top-1 -right-1">
                              <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                CRITICAL
                              </div>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-red-800">Re-distributor Level</p>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <Badge variant="outline" className="bg-white text-xs font-semibold">
                          Root Cause
                        </Badge>
                      </div>
                    </div>

                    {/* Connection Lines and Modules */}
                    <div className="flex flex-col gap-6">
                      {otifTreeData.modules.map((module, _index) => (
                        <div key={module.id} className="flex items-center gap-4">
                          {/* Connection Line */}
                          <div className="flex items-center">
                            <div className="w-12 h-0.5 bg-gray-400"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="w-12 h-0.5 bg-gray-400"></div>
                          </div>

                          {/* Module Card */}
                          <Card
                            className={`cursor-pointer transition-all hover:shadow-lg border-2 ${module.borderColor} ${
                              selectedModule === module.id ? "ring-2 ring-blue-500" : ""
                            }`}
                            onClick={() => handleModuleClick(module.id)}
                          >
                            <CardContent className={`p-4 ${module.bgColor} min-w-[280px]`}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className={`${module.color} text-white rounded-lg p-2`}>
                                  <module.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className={`font-bold text-sm ${module.textColor}`}>{module.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-2xl font-black ${module.textColor}`}>
                                      {module.percentage}%
                                    </span>
                                    <span className="text-xs text-gray-600">loss</span>
                                  </div>
                                </div>
                              </div>

                              {/* KPIs */}
                              <div className="space-y-2 mb-3">
                                {module.kpis.map((kpi, kpiIndex) => (
                                  <div key={kpiIndex} className="flex justify-between text-xs">
                                    <span className="font-medium text-gray-700">{kpi.name}:</span>
                                    <div className="flex gap-2">
                                      <span className="text-green-600 font-semibold">{kpi.current}</span>
                                      <span className="text-gray-500">→ {kpi.target}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {module.percentage > 0 && (
                                <Badge className={`${module.color} text-white text-xs`}>
                                  {module.reasons.length} contributing factors
                                </Badge>
                              )}
                            </CardContent>
                          </Card>

                          {/* Second Level - Reasons */}
                          {module.reasons.length > 0 && (
                            <div className="flex flex-col gap-3">
                              {module.reasons.map((reason, reasonIndex) => (
                                <div key={reasonIndex} className="flex items-center gap-2">
                                  {/* Connection to reason */}
                                  <div className="flex items-center">
                                    <div className="w-8 h-0.5 bg-gray-300"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                                    <div className="w-8 h-0.5 bg-gray-300"></div>
                                  </div>

                                  {/* Reason Card */}
                                  <Card className="border border-gray-200 hover:border-gray-300 transition-all">
                                    <CardContent className="p-3 bg-white min-w-[220px]">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div
                                          className={`${module.color} text-white rounded px-2 py-1 text-xs font-bold`}
                                        >
                                          {reason.percentage}%
                                        </div>
                                        <span className="text-xs font-medium text-gray-700">{reason.name}</span>
                                      </div>
                                      <p className="text-xs text-gray-500">{reason.module}</p>
                                    </CardContent>
                                  </Card>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Summary Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-2">Distribution Loss Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>DC Replenishment:</span>
                        <span className="font-semibold">55%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plant Dispatch Planning:</span>
                        <span className="font-semibold">10%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plant Dispatch Compliance:</span>
                        <span className="font-semibold">9%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-2">Supply Loss Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Production Execution:</span>
                        <span className="font-semibold">7%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Plant Capacity:</span>
                        <span className="font-semibold">5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Production Scheduling:</span>
                        <span className="font-semibold">4%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2">Demand Loss Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Forecast Accuracy:</span>
                        <span className="font-semibold">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supply Chain KPIs Performance</CardTitle>
                <CardDescription>Current performance vs targets across all modules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {otifTreeData.modules.map((module) => (
                    <div key={module.id} className={`p-4 ${module.bgColor} rounded-lg`}>
                      <h3 className={`text-lg font-semibold ${module.textColor} mb-4 flex items-center gap-2`}>
                        <module.icon className="h-5 w-5" />
                        {module.name} Module ({module.percentage}% loss)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {module.kpis.map((kpi, index) => (
                          <div key={index} className="bg-white p-4 rounded-lg border">
                            <h4 className="font-medium text-gray-900 mb-2">{kpi.name}</h4>
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Current</p>
                                <p className="text-lg font-bold text-green-600">{kpi.current}</p>
                              </div>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                              <div className="text-center">
                                <p className="text-sm text-gray-500">Target</p>
                                <p className="text-lg font-bold text-blue-600">{kpi.target}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>OTIF Performance Trend</CardTitle>
                  <CardDescription>Monthly progression vs baseline</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      baseline: {
                        label: "Baseline",
                        color: "hsl(var(--chart-1))",
                      },
                      current: {
                        label: "Current",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={otifTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[80, 100]} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="baseline"
                          stroke="var(--color-baseline)"
                          strokeDasharray="5 5"
                          name="Baseline"
                        />
                        <Line
                          type="monotone"
                          dataKey="current"
                          stroke="var(--color-current)"
                          strokeWidth={3}
                          name="Current Performance"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Benefits Summary</CardTitle>
                  <CardDescription>Key performance improvements achieved</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      baseline: {
                        label: "Baseline",
                        color: "hsl(var(--chart-1))",
                      },
                      current: {
                        label: "Current",
                        color: "hsl(var(--chart-2))",
                      },
                      target: {
                        label: "Target",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={benefitsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="metric" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="baseline" fill="var(--color-baseline)" name="Baseline" />
                        <Bar dataKey="current" fill="var(--color-current)" name="Current" />
                        <Bar dataKey="target" fill="var(--color-target)" name="Target" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Business Impact Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">+3%</div>
                    <div className="text-sm font-medium text-green-800">Sales Growth</div>
                    <div className="text-xs text-green-600 mt-1">Target: +5%</div>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">92%</div>
                    <div className="text-sm font-medium text-blue-800">OTIF Performance</div>
                    <div className="text-xs text-blue-600 mt-1">Target: 95%</div>
                  </div>
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">-2%</div>
                    <div className="text-sm font-medium text-purple-800">Inventory Reduction</div>
                    <div className="text-xs text-purple-600 mt-1">Target: -5%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
