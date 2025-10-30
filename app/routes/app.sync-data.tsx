/**
 * Data Sync Route - Manual Trigger
 *
 * This route allows you to manually sync Shopify data to Neon database.
 * Visit: /app/sync-data
 */

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import { Page, Card, Button, Banner, Text, BlockStack, InlineStack, Badge } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { syncOrdersFromShopify, syncProductsFromShopify } from "../services/shopify-sync.server";
import { useState } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  return json({
    shop: session.shop,
    apiUrl: admin.rest.session.shop,
  });
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action");

  try {
    if (action === "sync-orders") {
      const result = await syncOrdersFromShopify(admin.graphql, session.shop);
      return json({ success: true, type: "orders", ...result });
    }

    if (action === "sync-products") {
      const result = await syncProductsFromShopify(admin.graphql, session.shop);
      return json({ success: true, type: "products", ...result });
    }

    if (action === "sync-all") {
      const ordersResult = await syncOrdersFromShopify(admin.graphql, session.shop);
      const productsResult = await syncProductsFromShopify(admin.graphql, session.shop);

      return json({
        success: true,
        type: "all",
        orders: ordersResult,
        products: productsResult,
      });
    }

    return json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function SyncDataPage() {
  const { shop } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async (action: string) => {
    setSyncing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("action", action);

      const response = await fetch("", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
      revalidator.revalidate();
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Page
      title="Sync Data to Neon"
      subtitle={`Populate your Neon database with data from ${shop}`}
      backAction={{ url: "/app" }}
    >
      <BlockStack gap="500">
        <Banner tone="info">
          <Text as="p">
            Use this page to manually sync data from Shopify to your Neon PostgreSQL database.
            After the initial sync, webhooks will keep data in sync automatically.
          </Text>
        </Banner>

        {result && (
          <Banner tone={result.success ? "success" : "critical"}>
            {result.success ? (
              <BlockStack gap="200">
                <Text as="p" fontWeight="semibold">
                  ✅ Sync completed successfully!
                </Text>
                {result.type === "orders" && (
                  <Text as="p">Synced {result.synced} orders</Text>
                )}
                {result.type === "products" && (
                  <Text as="p">Synced {result.synced} products</Text>
                )}
                {result.type === "all" && (
                  <BlockStack gap="100">
                    <Text as="p">Orders: {result.orders.synced} synced</Text>
                    <Text as="p">Products: {result.products.synced} synced</Text>
                  </BlockStack>
                )}
              </BlockStack>
            ) : (
              <Text as="p">❌ Error: {result.error}</Text>
            )}
          </Banner>
        )}

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Sync Orders
            </Text>
            <Text as="p" tone="subdued">
              Fetch all orders from Shopify and store them in Neon database.
              This may take a few minutes for stores with many orders.
            </Text>
            <InlineStack gap="300">
              <Button
                onClick={() => handleSync("sync-orders")}
                loading={syncing}
                variant="primary"
              >
                Sync Orders
              </Button>
              <Badge tone="info">~2 min for 1000 orders</Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Sync Products
            </Text>
            <Text as="p" tone="subdued">
              Fetch all products from Shopify and store them in Neon database.
              This includes inventory levels.
            </Text>
            <InlineStack gap="300">
              <Button
                onClick={() => handleSync("sync-products")}
                loading={syncing}
                variant="primary"
              >
                Sync Products
              </Button>
              <Badge tone="info">~1 min for 1000 products</Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Sync Everything
            </Text>
            <Text as="p" tone="subdued">
              Sync both orders and products in one operation.
              Recommended for initial setup.
            </Text>
            <InlineStack gap="300">
              <Button
                onClick={() => handleSync("sync-all")}
                loading={syncing}
                variant="primary"
                tone="success"
              >
                Sync All Data
              </Button>
              <Badge tone="success">Recommended for first time</Badge>
            </InlineStack>
          </BlockStack>
        </Card>

        <Banner>
          <BlockStack gap="200">
            <Text as="p" fontWeight="semibold">
              💡 After syncing:
            </Text>
            <Text as="p">
              • Visit /app/analytics to see your data
            </Text>
            <Text as="p">
              • Visit /app/war-room for BFCM dashboard
            </Text>
            <Text as="p">
              • Webhooks will keep data in sync automatically
            </Text>
          </BlockStack>
        </Banner>
      </BlockStack>
    </Page>
  );
}
