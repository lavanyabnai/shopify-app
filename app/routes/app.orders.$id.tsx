import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
} from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';

const ORDER_QUERY = `
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      name
      createdAt
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      displayFulfillmentStatus
      displayFinancialStatus
      lineItems(first: 10) {
        nodes {
          title
          quantity
          originalUnitPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    console.log('=== Order Detail Loader Start ===');
    console.log('Request URL:', request.url);
    console.log('Params:', params);
    console.log('Timestamp:', new Date().toISOString());
    
    // First, let's try to authenticate without making any GraphQL calls
    console.log('Attempting authentication...');
    const { admin, session } = await authenticate.admin(request);
    console.log('✅ Authentication successful');
    console.log('Session shop:', session?.shop);
    console.log('Session ID:', session?.id);
    
    // Validate that we have an order ID parameter
    if (!params.id) {
      console.log('❌ No order ID provided');
      throw new Error('Order ID is required');
    }
    
    console.log('✅ Order ID provided:', params.id);
    
    // Convert order number to full GraphQL ID format
    const orderNumber = params.id;
    const orderId = `gid://shopify/Order/${orderNumber}`;
    
    console.log('Order number from URL:', orderNumber);
    console.log('Formatted order ID for GraphQL:', orderId);
    
    // Try a very simple query first to test connectivity
    console.log('Testing basic GraphQL connectivity...');
    const simpleQuery = `query { shop { name } }`;
    
    try {
      const testResponse = await admin.graphql(simpleQuery);
      const testData = await testResponse.json();
      console.log('✅ Basic GraphQL test successful:', testData);
    } catch (testError) {
      console.error('❌ Basic GraphQL test failed:', testError);
      throw new Error(`GraphQL connectivity test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
    }
    
    // Now try the order query
    console.log('Attempting order query...');
    console.log('Query:', ORDER_QUERY);
    console.log('Variables:', { id: orderId });
    
    const response = await admin.graphql(ORDER_QUERY, {
      variables: { id: orderId }
    });
    
    console.log('✅ GraphQL response received');
    const orderData = await response.json();
    
    // Log the response for debugging
    console.log('Order data response:', JSON.stringify(orderData, null, 2));
    
    // Check for GraphQL errors
    if ((orderData as any).errors) {
      console.error('❌ GraphQL errors found:', (orderData as any).errors);
      throw new Error(`GraphQL Error: ${(orderData as any).errors.map((e: any) => e.message).join(', ')}`);
    }
    
    // Check if order exists
    if (!orderData.data || !orderData.data.order) {
      console.log('⚠️ Order not found in response');
      return json({
        order: null,
        error: 'Order not found',
        debug: {
          orderNumber,
          orderId,
          hasData: !!orderData.data,
          dataKeys: orderData.data ? Object.keys(orderData.data) : [],
        }
      });
    }
    
    console.log('✅ Order found successfully:', orderData.data.order);
    console.log('Order number:', orderNumber);
    return json({
      order: orderData.data.order,
      debug: {
        orderNumber,
        orderId,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('❌ Error in order loader:', error);
    console.error('Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('Error message:', error instanceof Error ? error.message : 'No message');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return comprehensive error information
    return json({
      order: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: error instanceof Error ? error.name : 'UnknownError',
      debug: {
        timestamp: new Date().toISOString(),
        url: request.url,
        params: params,
      }
    });
  }
}

export default function OrderDetail() {
  const { order, error, errorType, debug } = useLoaderData<typeof loader>() as { 
    order: any; 
    error?: string; 
    errorType?: string;
    debug?: any;
  };

  console.log('OrderDetail component rendered with:', { order, error, errorType, debug });

  // Handle error state
  if (error) {
    return (
      <Page>
        <TitleBar title="Error Loading Order" />
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Error Loading Order</Text>
                <Text as="p" variant="bodyMd" tone="critical">
                  {error}
                </Text>
                {errorType && (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Error Type: {errorType}
                  </Text>
                )}
                <Text as="p" variant="bodyMd" tone="subdued">
                  This could be due to:
                  <ul>
                    <li>Server not running or crashed</li>
                    <li>Network connectivity issues</li>
                    <li>Invalid order ID</li>
                    <li>Insufficient permissions</li>
                    <li>Order not found in your store</li>
                    <li>Request timeout</li>
                  </ul>
                </Text>
                {debug && (
                  <Card>
                    <Text as="h3" variant="headingSm">Debug Information</Text>
                    <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: '#f6f6f7', padding: '12px', borderRadius: '4px' }}>
                      {JSON.stringify(debug, null, 2)}
                    </pre>
                  </Card>
                )}
                <InlineStack gap="300">
                  <Link to="/app/orders">
                    <Button>Back to Orders</Button>
                  </Link>
                  <Button 
                    onClick={() => window.location.reload()}
                    variant="secondary"
                  >
                    Retry
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  // Handle order not found state
  if (!order) {
    return (
      <Page>
        <TitleBar title="Order Not Found" />
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Order Not Found</Text>
                <Text as="p" variant="bodyMd">
                  The requested order could not be found. It may have been deleted or you may not have permission to view it.
                </Text>
                <Link to="/app/orders">
                  <Button>Back to Orders</Button>
                </Link>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title={`Order ${order.name}`} />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack gap="400" align="space-between">
                <Text as="h2" variant="headingMd">
                  Order {order.name}
                </Text>
                <Link to="/app/orders">
                  <Button>Back to Orders</Button>
                </Link>
              </InlineStack>
              
              <InlineStack gap="400">
                <Text as="p" variant="bodyMd">
                  <strong>Date:</strong> {new Date(order.createdAt).toISOString().split('T')[0]}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Total:</strong> {order.totalPriceSet.shopMoney.amount} {order.totalPriceSet.shopMoney.currencyCode}
                </Text>
              </InlineStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Customer</Text>
                <Text as="p" variant="bodyMd">
                  Guest Customer
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Customer details are not available due to privacy restrictions
                </Text>
              </BlockStack>

              <InlineStack gap="400">
                <Badge progress={order.displayFinancialStatus === 'PAID' ? 'complete' : 'incomplete'}>
                  {order.displayFinancialStatus}
                </Badge>
                <Badge progress={order.displayFulfillmentStatus === 'FULFILLED' ? 'complete' : 'incomplete'}>
                  {order.displayFulfillmentStatus}
                </Badge>
              </InlineStack>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">Items</Text>
                {order.lineItems.nodes.map((item: any, index: number) => (
                  <InlineStack key={index} gap="400" align="space-between">
                    <Text as="p" variant="bodyMd">
                      {item.title} x {item.quantity}
                    </Text>
                    <Text as="p" variant="bodyMd">
                      {item.originalUnitPriceSet.shopMoney.amount} {item.originalUnitPriceSet.shopMoney.currencyCode}
                    </Text>
                  </InlineStack>
                ))}
              </BlockStack>

              {/* Debug Information - Remove this in production */}
              {debug && (
                <BlockStack gap="200">
                  <Text as="h3" variant="headingSm">Debug Information</Text>
                  <Card>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      <strong>Component Data:</strong>
                    </Text>
                    <pre style={{ 
                      fontSize: '12px', 
                      overflow: 'auto', 
                      backgroundColor: '#f6f6f7', 
                      padding: '12px', 
                      borderRadius: '4px',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify({ order, error, errorType, debug }, null, 2)}
                    </pre>
                  </Card>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
