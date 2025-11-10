import { json, redirect } from "@remix-run/node"
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react"
import { authenticate } from "../shopify.server"
import { adjustInventoryQuantities, getInventoryItem } from "~/lib/shopify-inventory.server"
import {
  Page,
  Card,
  FormLayout,
  TextField,
  Select,
  Button,
  Banner,
  Text,
  LegacyStack,
  Layout
} from '@shopify/polaris'
import { useState, useCallback } from 'react'
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node"

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request)
  
  // Get the inventory item details
  const itemId = params.itemId
  if (!itemId) {
    throw new Response("Item ID is required", { status: 400 })
  }

  try {
    const inventoryItem = await getInventoryItem(admin.session, itemId)
    return json({ inventoryItem, itemId })
  } catch (error) {
    console.error('Error loading inventory item:', error)
    return json({ 
      inventoryItem: null, 
      itemId,
      error: "Failed to load inventory item" 
    })
  }
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request)
  const formData = await request.formData()
  
  const itemId = params.itemId
  const locationId = formData.get("locationId") as string
  const delta = parseInt(formData.get("delta") as string)
  const reason = formData.get("reason") as string
  const referenceDocument = formData.get("referenceDocument") as string

  if (!itemId || !locationId || isNaN(delta) || !reason) {
    return json({ 
      error: "Missing required fields",
      success: false 
    }, { status: 400 })
  }

  try {
    const result = await adjustInventoryQuantities(admin.session, [{
      inventoryItemId: itemId,
      locationId,
      delta,
      reason,
      referenceDocumentUri: referenceDocument || undefined
    }])

    return json({ 
      success: true, 
      adjustmentGroup: result,
      message: "Inventory adjusted successfully"
    })
  } catch (error) {
    console.error('Error adjusting inventory:', error)
    return json({ 
      error: error instanceof Error ? error.message : "Failed to adjust inventory",
      success: false 
    }, { status: 500 })
  }
}

export default function InventoryAdjustmentPage() {
  const { inventoryItem, itemId, error: loadError } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const navigation = useNavigation()
  
  const [delta, setDelta] = useState("")
  const [reason, setReason] = useState("")
  const [referenceDocument, setReferenceDocument] = useState("")
  const [selectedLocationId, setSelectedLocationId] = useState("")

  const isSubmitting = navigation.state === "submitting"

  const handleDeltaChange = useCallback((value: string) => setDelta(value), [])
  const handleReasonChange = useCallback((value: string) => setReason(value), [])
  const handleReferenceChange = useCallback((value: string) => setReferenceDocument(value), [])
  const handleLocationChange = useCallback((value: string) => setSelectedLocationId(value), [])

  // Create location options from inventory levels
  const locationOptions = inventoryItem?.inventoryLevels?.edges?.map((edge: any) => ({
    label: edge.node.location.name,
    value: edge.node.location.id
  })) || []

  if (loadError) {
    return (
      <Page title="Inventory Adjustment">
        <Layout>
          <Layout.Section>
            <Banner tone="critical" title="Error">
              <p>{loadError}</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  if (!inventoryItem) {
    return (
      <Page title="Inventory Adjustment">
        <Layout>
          <Layout.Section>
            <Banner tone="critical" title="Item Not Found">
              <p>The requested inventory item could not be found.</p>
            </Banner>
          </Layout.Section>
        </Layout>
      </Page>
    )
  }

  return (
    <Page
      title="Adjust Inventory"
      subtitle={`${inventoryItem.variant.title} (${inventoryItem.sku})`}
      breadcrumbs={[
        { content: 'Inventory', url: '/inv/shopify-inventory' },
        { content: 'Adjust' }
      ]}
    >
      <Layout>
        <Layout.Section>
          {actionData?.error && (
            <Banner tone="critical" title="Error">
              <p>{actionData.error}</p>
            </Banner>
          )}
          
          {actionData?.success && (
            <Banner tone="success" title="Success">
              <p>{actionData.message}</p>
            </Banner>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <FormLayout>
              <FormLayout.Group>
                <TextField
                  label="Product"
                  value={inventoryItem.variant.title}
                  disabled
                />
                <TextField
                  label="SKU"
                  value={inventoryItem.sku}
                  disabled
                />
              </FormLayout.Group>

              <Select
                label="Location"
                options={[
                  { label: 'Select a location', value: '' },
                  ...locationOptions
                ]}
                value={selectedLocationId}
                onChange={handleLocationChange}
              />

              <TextField
                label="Adjustment Amount"
                type="number"
                value={delta}
                onChange={handleDeltaChange}
                helpText="Positive number to increase inventory, negative to decrease"
                placeholder="Enter amount to adjust"
              />

              <TextField
                label="Reason for Adjustment"
                value={reason}
                onChange={handleReasonChange}
                multiline={3}
                helpText="Required: Explain why this adjustment is being made"
                placeholder="e.g., Stock count correction, damaged goods, etc."
              />

              <TextField
                label="Reference Document (Optional)"
                value={referenceDocument}
                onChange={handleReferenceChange}
                helpText="PO number, invoice, or other reference document"
                placeholder="e.g., PO-12345, Invoice-67890"
              />
            </FormLayout>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <FormLayout>
              <Form method="post">
                <input type="hidden" name="locationId" value={selectedLocationId} />
                <input type="hidden" name="delta" value={delta} />
                <input type="hidden" name="reason" value={reason} />
                <input type="hidden" name="referenceDocument" value={referenceDocument} />
                
                <LegacyStack distribution="trailing">
                  <ButtonGroup>
                    <Button
                      url="/inv/shopify-inventory"
                      variant="tertiary"
                    >
                      Cancel
                    </Button>
                    <Button
                      submit
                      variant="primary"
                      loading={isSubmitting}
                      disabled={!selectedLocationId || !delta || !reason || isSubmitting}
                    >
                      {isSubmitting ? 'Adjusting...' : 'Adjust Inventory'}
                    </Button>
                  </ButtonGroup>
                </LegacyStack>
              </Form>
            </FormLayout>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card title="Current Inventory Levels">
            <FormLayout>
              {inventoryItem.inventoryLevels.edges.map((edge: any, index: number) => {
                const level = edge.node
                return (
                  <Card key={index} sectioned>
                    <LegacyStack distribution="equalSpacing">
                      <LegacyStack vertical spacing="tight">
                        <Text variant="headingMd" as="h3">{level.location.name}</Text>
                        <LegacyStack spacing="loose">
                          <LegacyStack vertical spacing="extraTight">
                            <Text variant="bodySm" tone="subdued" as="span">Available</Text>
                            <Text variant="bodyMd" fontWeight="medium" as="span">{level.available}</Text>
                          </LegacyStack>
                          <LegacyStack vertical spacing="extraTight">
                            <Text variant="bodySm" tone="subdued" as="span">Committed</Text>
                            <Text variant="bodyMd" as="span">{level.committed}</Text>
                          </LegacyStack>
                          <LegacyStack vertical spacing="extraTight">
                            <Text variant="bodySm" tone="subdued" as="span">Reserved</Text>
                            <Text variant="bodyMd" as="span">{level.reserved}</Text>
                          </LegacyStack>
                          <LegacyStack vertical spacing="extraTight">
                            <Text variant="bodySm" tone="subdued" as="span">On Hand</Text>
                            <Text variant="bodyMd" fontWeight="medium" as="span">{level.onHand}</Text>
                          </LegacyStack>
                        </LegacyStack>
                      </LegacyStack>
                    </LegacyStack>
                  </Card>
                )
              })}
            </FormLayout>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  )
}
