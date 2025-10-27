import { json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { authenticate } from '../shopify.server';
import { Page, Card, Text, BlockStack, Badge } from '@shopify/polaris';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    console.log('=== Debug Route ===');
    const { admin, session } = await authenticate.admin(request);
    
    // Test basic GraphQL connection
    const testQuery = `
      query TestQuery {
        shop {
          name
          myshopifyDomain
        }
        orders(first: 1) {
          nodes {
            id
            name
          }
        }
      }
    `;
    
    const response = await admin.graphql(testQuery);
    const data = await response.json();
    
    return json({
      success: true,
      session: {
        shop: session?.shop,
        id: session?.id,
        isOnline: session?.isOnline,
        scope: session?.scope,
      },
      graphql: data,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasApiKey: !!process.env.SHOPIFY_API_KEY,
        hasApiSecret: !!process.env.SHOPIFY_API_SECRET,
        hasScopes: !!process.env.SCOPES,
        hasAppUrl: !!process.env.SHOPIFY_APP_URL,
      }
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export default function Debug() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page title="Debug Information">
      <BlockStack gap="400">
        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Connection Status</Text>
            <Badge progress={data.success ? 'complete' : 'incomplete'}>
              {data.success ? 'Connected' : 'Failed'}
            </Badge>
            {data.error && (
              <Text as="p" tone="critical">{data.error}</Text>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Session Information</Text>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(data.session, null, 2)}
            </pre>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">Environment Variables</Text>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(data.environment, null, 2)}
            </pre>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">GraphQL Response</Text>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(data.graphql, null, 2)}
            </pre>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
