import { useParams } from "@remix-run/react"
import SafetyStockDashboard from "../components/controlKpi/safetyStock/safety-stock-dashboard"

function getSafetyStockData(alertId: string) {
  const safetyStockData = [
    {
      id: "1",
      skuCode: "1014",
      productName: "PLASTIC BOTTLE 200ml",
      location: "Plant L003",
      currentSafetyStock: 1750,
      recommendedSafetyStock: 1400,
      safetyStockDays: 29,
      recommendedDays: 24,
      inventorySavings: 189626,
      serviceRiskReduction: 0,
      co2Impact: -20.60,
      segment: "B/Y",
      targetServiceLevel: 94,
      priority: "High",
      createdDate: "22-Sep-2024",
      averageDemand: 15028,
      demandVariation: 1362,
      forecastError: 9,
      replenishmentLeadTime: 50,
      leadTimeVariability: 75,
      currentServiceLevel: 94,
    },
    {
      id: "2",
      skuCode: "1006",
      productName: "GLASS BOTTLE 500ml",
      location: "Plant L001",
      currentSafetyStock: 2100,
      recommendedSafetyStock: 1800,
      safetyStockDays: 32,
      recommendedDays: 27,
      inventorySavings: 156000,
      serviceRiskReduction: 0,
      co2Impact: -18.50,
      segment: "A/X",
      targetServiceLevel: 96,
      priority: "High",
      createdDate: "20-Sep-2024",
      averageDemand: 18500,
      demandVariation: 1850,
      forecastError: 8,
      replenishmentLeadTime: 48,
      leadTimeVariability: 70,
      currentServiceLevel: 96,
    },
  ]

  return safetyStockData.find((item) => item.id === alertId) || safetyStockData[0]
}

export default function SafetyStockDetailPage() {
  const params = useParams()
  const alertId = params.alertId || '1'
  const safetyStockData = getSafetyStockData(alertId)

  return <SafetyStockDashboard safetyStockData={safetyStockData} />
}
