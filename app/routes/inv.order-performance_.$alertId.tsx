import { json, type LoaderFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import { useParams } from "@remix-run/react"
import OrderPerformanceDetail from "../components/controlKpi/orderPerformance/order-performance-detail"
import {
  getOrderPerformanceAlert,
  getOrderLineItems,
  getPeggingDetails,
  getAlternateProposals,
  getLearningData,
} from "../services/order-performance.server"

export const loader: LoaderFunction = async ({ params }) => {
  const alertId = params.alertId || ""

  const alert = getOrderPerformanceAlert(alertId)
  if (!alert) {
    throw new Response("Alert not found", { status: 404 })
  }

  const lineItems = getOrderLineItems(alertId)
  const peggingDetails = getPeggingDetails(alertId)
  const alternateProposals = getAlternateProposals(alertId)
  const learningData = getLearningData(alertId)

  return json({
    alert,
    lineItems,
    peggingDetails,
    alternateProposals,
    learningData,
  })
}

export default function OrderPerformanceDetailPage() {
  const { alert, lineItems, peggingDetails, alternateProposals, learningData } =
    useLoaderData<typeof loader>()

  return (
    <OrderPerformanceDetail
      alert={alert}
      lineItems={lineItems}
      peggingDetails={peggingDetails}
      alternateProposals={alternateProposals}
      learningData={learningData}
    />
  )
}
