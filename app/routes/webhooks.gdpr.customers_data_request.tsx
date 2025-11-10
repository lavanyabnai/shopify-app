import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { ActionFunctionArgs } from "@remix-run/node";

/**
 * GDPR Compliance: Customer Data Request Webhook
 *
 * When a store owner receives a customer data request (GDPR, CCPA, etc.),
 * Shopify triggers this webhook. You must provide all data you have stored
 * about this customer.
 *
 * Response time: You have 30 days to provide the data to the merchant.
 *
 * Required data to collect:
 * - Customer orders and line items
 * - Any analytics data associated with customer
 * - Any other customer-specific data your app stores
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log(`📥 GDPR: Customer data request for shop: ${shop}`);

    if (!payload) {
      console.error("❌ No payload received");
      return new Response("No payload", { status: 400 });
    }

    // Extract customer information from webhook
    const customerId = payload.customer?.id?.toString();
    const customerEmail = payload.customer?.email;
    const ordersRequested = payload.orders_requested || [];

    console.log(`📋 Data request for customer ${customerEmail} (${customerId})`);

    // Collect all data for this customer
    const customerData = await collectCustomerData(shop, customerId, customerEmail);

    // Log the data request for compliance tracking
    await logDataRequest(shop, {
      customerId,
      customerEmail,
      ordersRequested,
      dataCollected: customerData,
      requestedAt: new Date(),
    });

    /**
     * IMPORTANT: In production, you should:
     * 1. Store this data request in a compliance tracking system
     * 2. Send an email notification to the merchant
     * 3. Provide a download link or email the data package
     * 4. Keep audit logs for compliance purposes
     *
     * For now, we're logging it to the database and console.
     */

    console.log(`✅ Customer data request processed for ${shop}`);
    console.log(`📊 Data collected:`, JSON.stringify(customerData, null, 2));

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`❌ Error processing customer data request:`, error);
    return new Response("Error", { status: 500 });
  }
};

/**
 * Collect all customer data from your database
 */
async function collectCustomerData(
  shop: string,
  customerId?: string,
  customerEmail?: string
) {
  // Query all data associated with this customer
  const orders = await db.order.findMany({
    where: {
      shop,
      OR: [
        customerId ? { customerId } : {},
        customerEmail ? { customerEmail } : {},
      ],
    },
    include: {
      lineItems: true,
    },
  });

  /**
   * TODO: Add any other customer-specific data your app stores
   * Examples:
   * - Analytics events
   * - User preferences
   * - Alerts/notifications sent
   * - Recommendations generated
   * - Simulation results
   * - Action executions
   */

  return {
    customerId,
    customerEmail,
    orders: orders.map((order) => ({
      id: order.id,
      name: order.name,
      totalPrice: order.totalPrice,
      currency: order.currency,
      createdAt: order.createdAt,
      lineItems: order.lineItems.map((item) => ({
        productTitle: item.productTitle,
        variantTitle: item.variantTitle,
        quantity: item.quantity,
        price: item.price,
      })),
    })),
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + o.totalPrice, 0),
  };
}

/**
 * Log data request for compliance audit trail
 */
async function logDataRequest(shop: string, requestData: any) {
  // Store in AlertLog for now (could create dedicated GDPRLog table)
  await db.alertLog.create({
    data: {
      shop,
      severity: "info",
      alertType: "gdpr_data_request",
      title: "Customer Data Request",
      message: `Data request received for customer ${requestData.customerEmail}`,
      metadata: JSON.stringify(requestData),
      acknowledged: false,
    },
  });

  console.log(`📝 Logged GDPR data request for ${shop}`);
}
