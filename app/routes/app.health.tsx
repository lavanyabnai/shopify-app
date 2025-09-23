import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { Page, Card, Text, BlockStack, Badge, Button } from '@shopify/polaris';

export async function loader({ request }: LoaderFunctionArgs) {
  const startTime = Date.now();
  
  try {
    console.log('=== Health Check Start ===');
    console.log('Request URL:', request.url);
    console.log('Timestamp:', new Date().toISOString());
    
    // Test authentication
    console.log('Testing authentication...');
    const { admin, session } = await authenticate.admin(request);
    console.log('✅ Authentication successful');
    
    // Test basic GraphQL connectivity
    console.log('Testing GraphQL connectivity...');
    const testQuery = `query { shop { name myshopifyDomain } }`;
    const response = await admin.graphql(testQuery);
    const data = await response.json();
    console.log('✅ GraphQL test successful');
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      shop: {
        name: data.data?.shop?.name || 'Unknown',
        domain: data.data?.shop?.myshopifyDomain || 'Unknown',
      },
      session: {
        shop: session?.shop || 'Unknown',
        id: session?.id || 'Unknown',
        isOnline: session?.isOnline || false,
      },
      server: {
        nodeEnv: process.env.NODE_ENV,
        hasApiKey: !!process.env.SHOPIFY_API_KEY,
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        hasScopes: !!process.env.SCOPES,
        hasAppUrl: !!process.env.SHOPIFY_APP_URL,
      }
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.name : 'UnknownError',
      server: {
        nodeEnv: process.env.NODE_ENV,
        hasApiKey: !!process.env.SHOPIFY_API_KEY,
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        hasScopes: !!process.env.SCOPES,
        hasAppUrl: !!process.env.SHOPIFY_APP_URL,
      }
    });
  }
}

export default function HealthCheck() {
  const data = useLoaderData<typeof loader>() as any;

  return (
    <Page title="Server Health Check">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Server Status</Text>
            <Badge progress={data.status === 'healthy' ? 'complete' : 'incomplete'}>
              {data.status === 'healthy' ? 'Healthy' : 'Unhealthy'}
            </Badge>
            <Text as="p" variant="bodyMd">
              Response Time: {data.responseTime}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              Checked at: {data.timestamp}
            </Text>
          </BlockStack>
        </Card>

        {data.status === 'healthy' && (
          <>
            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Shop Information</Text>
                <Text as="p" variant="bodyMd">
                  <strong>Name:</strong> {data.shop.name}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Domain:</strong> {data.shop.domain}
                </Text>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="300">
                <Text as="h3" variant="headingSm">Session Information</Text>
                <Text as="p" variant="bodyMd">
                  <strong>Shop:</strong> {data.session.shop}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Session ID:</strong> {data.session.id}
                </Text>
                <Text as="p" variant="bodyMd">
                  <strong>Online:</strong> {data.session.isOnline ? 'Yes' : 'No'}
                </Text>
              </BlockStack>
            </Card>
          </>
        )}

        {data.status === 'unhealthy' && (
          <Card>
            <BlockStack gap="300">
              <Text as="h3" variant="headingSm">Error Information</Text>
              <Text as="p" variant="bodyMd" tone="critical">
                <strong>Error:</strong> {data.error}
              </Text>
              {data.errorType && (
                <Text as="p" variant="bodyMd">
                  <strong>Error Type:</strong> {data.errorType}
                </Text>
              )}
            </BlockStack>
          </Card>
        )}

        <Card>
          <BlockStack gap="300">
            <Text as="h3" variant="headingSm">Environment Configuration</Text>
            <Text as="p" variant="bodyMd">
              <strong>Node Environment:</strong> {data.server.nodeEnv}
            </Text>
            <Text as="p" variant="bodyMd">
              <strong>API Key:</strong> {data.server.hasApiKey ? '✅ Configured' : '❌ Missing'}
            </Text>
            <Text as="p" variant="bodyMd">
              <strong>API Secret:</strong> {data.server.hasApiSecret ? '✅ Configured' : '❌ Missing'}
            </Text>
            <Text as="p" variant="bodyMd">
              <strong>Scopes:</strong> {data.server.hasScopes ? '✅ Configured' : '❌ Missing'}
            </Text>
            <Text as="p" variant="bodyMd">
              <strong>App URL:</strong> {data.server.hasAppUrl ? '✅ Configured' : '❌ Missing'}
            </Text>
          </BlockStack>
        </Card>

        <Button onClick={() => window.location.reload()}>
          Refresh Health Check
        </Button>
      </BlockStack>
    </Page>
  );
}
