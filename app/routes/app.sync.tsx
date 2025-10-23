import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { syncOrdersFromShopify, syncProductsFromShopify } from "../services/shopify-sync.server";
import db from "../db.server";
import {
  Page,
  Card,
  Button,
  Text,
  BlockStack,
  InlineStack,
  Banner,
  Divider,
  TextField
} from "@shopify/polaris";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);

  const syncStatus = await db.syncStatus.findUnique({
    where: { shop: session.shop },
  });

  // Get counts from database
  const orderCount = await db.order.count({
    where: { shop: session.shop },
  });

  const productCount = await db.product.count({
    where: { shop: session.shop },
  });

  return json({
    syncStatus,
    orderCount,
    productCount,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { admin, session } = await authenticate.admin(request);

  const formData = await request.formData();
  const syncType = formData.get("type") as string;
  const limitParam = formData.get("limit") as string;
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  try {
    if (syncType === "orders") {
      const result = await syncOrdersFromShopify(admin.graphql, session.shop, {
        limit, // No limit = sync all orders
      });
      return json(result);
    } else if (syncType === "products") {
      const result = await syncProductsFromShopify(admin.graphql, session.shop, {
        limit: limit || 1000, // Products sync
      });
      return json(result);
    } else {
      return json({ success: false, error: "Invalid sync type" }, { status: 400 });
    }
  } catch (error: any) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
}

export default function SyncPage() {
  const { syncStatus, orderCount, productCount } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const [orderLimit, setOrderLimit] = useState("");
  const [productLimit, setProductLimit] = useState("1000");

  const isSyncing = syncStatus?.syncInProgress || fetcher.state !== "idle";

  // Auto-refresh when sync completes
  useEffect(() => {
    if (fetcher.data?.success && fetcher.state === "idle") {
      // Reload page data after sync completes
      window.location.reload();
    }
  }, [fetcher.data, fetcher.state]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <Page
      title="Data Sync"
      subtitle="Synchronize orders and products from Shopify to local database"
    >
      <BlockStack gap="500">
        {/* Sync Status Banner */}
        {isSyncing && (
          <Banner tone="info">
            <Text as="p">Sync in progress... This may take several minutes.</Text>
          </Banner>
        )}

        {syncStatus?.lastError && (
          <Banner tone="critical">
            <Text as="p" fontWeight="bold">Last sync failed:</Text>
            <Text as="p">{syncStatus.lastError}</Text>
            <Text as="p" tone="subdued">
              {formatDate(syncStatus.lastErrorAt)}
            </Text>
          </Banner>
        )}

        {fetcher.data?.success && (
          <Banner tone="success">
            <Text as="p">
              ✅ Sync completed successfully! {fetcher.data.synced} items synced.
            </Text>
          </Banner>
        )}

        {/* Sync Status Card */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Sync Status</Text>

            <Divider />

            <InlineStack gap="400" blockAlign="center">
              <Text as="span" tone="subdued">Status:</Text>
              <Text as="span" fontWeight="semibold">
                {isSyncing ? "🔄 Syncing..." : "✅ Idle"}
              </Text>
            </InlineStack>

            <InlineStack gap="400" blockAlign="center">
              <Text as="span" tone="subdued">Last order sync:</Text>
              <Text as="span">{formatDate(syncStatus?.lastOrderSync)}</Text>
            </InlineStack>

            <InlineStack gap="400" blockAlign="center">
              <Text as="span" tone="subdued">Last product sync:</Text>
              <Text as="span">{formatDate(syncStatus?.lastProductSync)}</Text>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Database Statistics */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Database Statistics</Text>

            <Divider />

            <InlineStack gap="400" blockAlign="center">
              <Text as="span" tone="subdued">Total orders in database:</Text>
              <Text as="span" fontWeight="bold">{orderCount}</Text>
            </InlineStack>

            <InlineStack gap="400" blockAlign="center">
              <Text as="span" tone="subdued">Total products in database:</Text>
              <Text as="span" fontWeight="bold">{productCount}</Text>
            </InlineStack>
          </BlockStack>
        </Card>

        {/* Sync Actions */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">Manual Sync</Text>

            <Divider />

            <Text as="p" tone="subdued">
              Manually trigger a sync to fetch the latest data from Shopify.
              Leave limit empty to sync ALL orders (recommended for initial setup).
            </Text>

            <BlockStack gap="400">
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Orders Sync</Text>
                <TextField
                  label="Order limit (leave empty for all orders)"
                  value={orderLimit}
                  onChange={setOrderLimit}
                  placeholder="No limit - sync all orders"
                  autoComplete="off"
                  helpText="Syncing 10,000+ orders takes ~20-40 minutes due to rate limiting"
                />
                <Button
                  onClick={() => {
                    const formData = new FormData();
                    formData.append("type", "orders");
                    if (orderLimit) formData.append("limit", orderLimit);
                    fetcher.submit(formData, { method: "post" });
                  }}
                  loading={fetcher.state !== "idle" && fetcher.formData?.get("type") === "orders"}
                  disabled={isSyncing}
                  variant="primary"
                >
                  {orderLimit ? `Sync ${orderLimit} Orders` : "Sync All Orders"}
                </Button>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Products Sync</Text>
                <TextField
                  label="Product limit"
                  value={productLimit}
                  onChange={setProductLimit}
                  placeholder="1000"
                  autoComplete="off"
                />
                <Button
                  onClick={() => {
                    const formData = new FormData();
                    formData.append("type", "products");
                    if (productLimit) formData.append("limit", productLimit);
                    fetcher.submit(formData, { method: "post" });
                  }}
                  loading={fetcher.state !== "idle" && fetcher.formData?.get("type") === "products"}
                  disabled={isSyncing}
                >
                  Sync {productLimit || "All"} Products
                </Button>
              </BlockStack>
            </BlockStack>

            <Banner tone="warning">
              <Text as="p" fontWeight="semibold">⚠️ For 10,000+ orders:</Text>
              <Text as="p">• Leave order limit empty to sync ALL orders</Text>
              <Text as="p">• Expect 20-40 minutes for complete sync (500ms delay per 250 orders)</Text>
              <Text as="p">• Keep this tab open until sync completes</Text>
              <Text as="p">• After sync, run "Compute Analytics" to generate historical snapshots</Text>
            </Banner>
          </BlockStack>
        </Card>

        {/* Instructions */}
        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">About Data Sync</Text>

            <Divider />

            <BlockStack gap="200">
              <Text as="p">
                <Text as="span" fontWeight="semibold">Why sync data?</Text>
                {" "}Syncing data to your local database enables fast dashboard loads
                (&lt;2s instead of 30-60s) by eliminating Shopify API calls on every page load.
              </Text>

              <Text as="p">
                <Text as="span" fontWeight="semibold">When to sync?</Text>
                {" "}Data is automatically synced via webhooks when orders or products are
                created/updated. Use manual sync for initial setup or to backfill historical data.
              </Text>

              <Text as="p">
                <Text as="span" fontWeight="semibold">How long does it take?</Text>
                {" "}Approximately 2-4 minutes per 1000 orders due to rate limiting.
              </Text>
            </BlockStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
