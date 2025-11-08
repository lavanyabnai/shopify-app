import { json } from "@remix-run/node"

import ShopifyInventoryTable from "../components/inventory/shopify-inventory-table"
import type { LoaderFunctionArgs } from "@remix-run/node"

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  // In a real implementation, you would fetch data from Shopify's GraphQL API
  // For now, we'll use the mock data from the component
  
  return json({
    workspaceId: params.workspaceId,
    timestamp: new Date().toISOString()
  })
}

export default function ShopifyInventoryPage() {
  return <ShopifyInventoryTable />
}
