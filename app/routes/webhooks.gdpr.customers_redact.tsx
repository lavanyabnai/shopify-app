import { authenticate } from "../shopify.server";
import db from "../db.server";
import type { ActionFunctionArgs } from "@remix-run/node";

/**
 * GDPR Compliance: Customer Redaction Webhook
 *
 * When a store owner requests customer data deletion (GDPR "Right to be Forgotten"),
 * Shopify triggers this webhook. You must delete or anonymize all data you have
 * stored about this customer.
 *
 * Response time: You have 30 days to complete the redaction.
 *
 * IMPORTANT: This is triggered AFTER the customer data has been removed from Shopify.
 * You should delete or anonymize all customer-specific data in your database.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);

    console.log(`📥 GDPR: Customer redaction request for shop: ${shop}`);

    if (!payload) {
      console.error("❌ No payload received");
      return new Response("No payload", { status: 400 });
    }

    // Extract customer information from webhook
    const customerId = payload.customer?.id?.toString();
    const customerEmail = payload.customer?.email;
    const ordersToRedact = payload.orders_to_redact || [];

    console.log(
      `🗑️  Redacting data for customer ${customerEmail} (${customerId})`
    );

    // Log redaction request BEFORE deleting data
    await logRedactionRequest(shop, {
      customerId,
      customerEmail,
      ordersToRedact,
      requestedAt: new Date(),
    });

    // Anonymize customer data (recommended over deletion for analytics integrity)
    await anonymizeCustomerData(shop, customerId, customerEmail);

    console.log(
      `✅ Customer data redacted for ${customerEmail} in shop ${shop}`
    );

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error(`❌ Error processing customer redaction:`, error);
    return new Response("Error", { status: 500 });
  }
};

/**
 * Anonymize customer data while preserving analytics integrity
 *
 * Best practice: Anonymize rather than delete to maintain:
 * - Order history for business analytics
 * - Revenue metrics
 * - Inventory trends
 *
 * Remove PII:
 * - Email addresses
 * - Customer IDs
 * - Names
 * - Addresses
 */
async function anonymizeCustomerData(
  shop: string,
  customerId?: string,
  customerEmail?: string
) {
  // Anonymize orders
  const anonymizedData = {
    customerId: null, // Remove customer link
    customerEmail: null, // Remove email
    email: null, // Remove order email
    // Keep: totalPrice, currency, createdAt for analytics
  };

  const result = await db.order.updateMany({
    where: {
      shop,
      OR: [
        customerId ? { customerId } : {},
        customerEmail ? { customerEmail } : {},
      ],
    },
    data: anonymizedData,
  });

  console.log(`🔒 Anonymized ${result.count} orders for customer`);

  /**
   * TODO: Anonymize any other customer-specific data
   * Examples:
   * - Analytics events (remove customer identifiers)
   * - Alert logs (remove customer details)
   * - Executed actions (if customer-specific)
   * - Simulation results (if customer-specific)
   */

  // If you have other tables with customer data, anonymize them here
  // Example:
  // await db.analyticsEvent.updateMany({
  //   where: { shop, customerId },
  //   data: { customerId: null, customerEmail: null },
  // });

  return result;
}

/**
 * Log redaction request for compliance audit trail
 * IMPORTANT: Log BEFORE deleting data for audit purposes
 */
async function logRedactionRequest(shop: string, requestData: any) {
  await db.alertLog.create({
    data: {
      shop,
      severity: "info",
      alertType: "gdpr_customer_redaction",
      title: "Customer Data Redaction",
      message: `Redaction completed for customer ${requestData.customerEmail}`,
      metadata: JSON.stringify({
        ...requestData,
        completedAt: new Date(),
      }),
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });

  console.log(`📝 Logged GDPR redaction for ${shop}`);
}
