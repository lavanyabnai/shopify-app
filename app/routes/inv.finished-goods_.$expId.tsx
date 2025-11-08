import VRProductDashboard from "../components/controlKpi/vr-product-dashboard"
import { useParams } from "@remix-run/react"
// Mock function to get product data based on slug
function getProductData(slug: string) {
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
  
  

  // Find matching product based on slug
  return finishedGoodsData.find((item) => slug.includes(encodeURIComponent(item.sku))) || finishedGoodsData[0]
}

export default function ProductDetailPage() {
  // Unwrap params using React.use()
  const params = useParams()
  const slug = params.slug as string
  const productData = getProductData(slug)

  return <VRProductDashboard productData={productData} />
}
